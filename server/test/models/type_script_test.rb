require "test_helper"

class TypeScriptTest < ActiveSupport::TestCase
  context "associations" do
    should belong_to(:cell_output)
  end

  context "validations" do
    should validate_presence_of(:binary_hash)
  end

  test "#binary_hash should decodes packed string" do
    VCR.use_cassette("blocks/10") do
      SyncInfo.local_inauthentic_tip_block_number
      node_block = CkbSync::Api.get_block(DEFAULT_NODE_BLOCK_HASH).deep_stringify_keys
      CkbSync::Persist.save_block(node_block, "inauthentic")
      packed_block_hash = DEFAULT_NODE_BLOCK_HASH
      block = Block.find_by(block_hash: packed_block_hash)
      ckb_transaction = block.ckb_transactions.first
      cell_output = ckb_transaction.cell_outputs.first
      type_script = cell_output.type_script
      lock_script = cell_output.lock_script
      if type_script.blank?
        type_script = cell_output.create_type_script(
          args: lock_script.args,
          binary_hash: lock_script.binary_hash,
          version: lock_script.version
        )
      else
        type_script = cell_output.type_script
      end
      assert_equal unpack_attribute(type_script, "binary_hash"), type_script.binary_hash
    end
  end
end