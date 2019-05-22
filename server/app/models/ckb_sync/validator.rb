module CkbSync
  class Validator
    class << self
      def validate(block_number)
        node_block = CkbSync::Api.instance.get_block_by_number(block_number).to_h.deep_stringify_keys
        local_block = Block.find_by(number: node_block.dig("header", "number"))

        ApplicationRecord.transaction do
          return if local_block.blank?

          local_block.verify!(node_block)
          update_cell_status!(local_block)
          update_address_balance_and_cell_consumed!(local_block)
        end
      end

      def call(block_hash)
        node_block = CkbSync::Api.instance.get_block(block_hash).to_h.deep_stringify_keys
        local_block = Block.find_by(number: node_block.dig("header", "number"))

        ApplicationRecord.transaction do
          return if local_block.blank?

          local_block.verify!(node_block)
          update_cell_status!(local_block)
          update_address_balance_and_cell_consumed!(local_block)
        end
      end

      private

      def update_cell_status!(local_block)
        cell_inputs = []
        local_block.ckb_transactions.find_each do |ckb_transaction|
          cell_inputs << ckb_transaction.cell_inputs
        end

        cell_output_ids = Set.new
        cell_inputs.flatten.each do |cell_input|
          cell_output_ids << cell_input.previous_cell_output&.id
        end

        CellOutput.where(id: cell_output_ids.delete(nil)).update_all(status: :dead)
      end

      def update_address_balance_and_cell_consumed!(local_block)
        addresses = []
        address_hashes = []
        local_block.contained_addresses.each do |address|
          address.balance = CkbUtils.get_balance(address.address_hash) || 0

          if address.changed?
            addresses << address
            address_hashes << address.address_hash
          end
        end

        if !addresses.empty?
          Sidekiq::Client.push_bulk("class" => "UpdateAddressCellConsumedWorker", "args" => address_hashes.map { |hash| [hash] }, "queue" => "address_cell_consumed_updater")
          Address.import! addresses, on_duplicate_key_update: [:balance, :cell_consumed]
        end
      end
    end
  end
end
