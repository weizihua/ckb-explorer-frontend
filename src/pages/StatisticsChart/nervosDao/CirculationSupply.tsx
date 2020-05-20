import React, { useEffect } from 'react'
import { useAppState, useDispatch } from '../../../contexts/providers'
import i18n, { currentLanguage } from '../../../utils/i18n'
import { getStatisticCirculationSupply } from '../../../service/app/charts/nervosDao'
import { parseDateNoTime } from '../../../utils/date'
import { isMobile } from '../../../utils/screen'
import { ChartColors } from '../../../utils/const'
import { ChartLoading, ReactChartCore, ChartPage } from '../common/ChartComp'
import { AppDispatch } from '../../../contexts/reducer'
import { PageActions } from '../../../contexts/actions'
import { handleAxis } from '../../../utils/chart'
import BigNumber from 'bignumber.js'

const gridThumbnail = {
  left: '4%',
  right: '10%',
  top: '8%',
  bottom: '6%',
  containLabel: true,
}
const grid = {
  left: '3%',
  right: '3%',
  bottom: '5%',
  containLabel: true,
}

const getOption = (statisticCirculationSupply: State.StatisticCirculationSupply[], isThumbnail = false) => {
  return {
    color: ChartColors,
    tooltip: !isThumbnail && {
      trigger: 'axis',
      formatter: (dataList: any[]) => {
        const colorSpan = (color: string) =>
          `<span style="display:inline-block;margin-right:8px;margin-left:5px;margin-bottom:2px;border-radius:10px;width:6px;height:6px;background-color:${color}"></span>`
        const widthSpan = (value: string) =>
          `<span style="width:${currentLanguage() === 'en' ? '160px' : '105px'};display:inline-block;">${value}:</span>`
        let result = `<div>${colorSpan('#333333')}${widthSpan(i18n.t('statistic.date'))} ${parseDateNoTime(
          dataList[0].name,
        )}</div>`
        if (dataList[0].data) {
          result += `<div>${colorSpan(ChartColors[0])}${widthSpan(i18n.t('statistic.circulation_supply'))} ${handleAxis(
            dataList[0].data,
            2,
          )}</div>`
        }
        return result
      },
    },
    grid: isThumbnail ? gridThumbnail : grid,
    xAxis: [
      {
        name: isMobile() || isThumbnail ? '' : i18n.t('statistic.date'),
        nameLocation: 'middle',
        nameGap: '30',
        type: 'category',
        boundaryGap: false,
        data: statisticCirculationSupply.map(data => data.createdAtUnixtimestamp),
        axisLabel: {
          formatter: (value: string) => parseDateNoTime(value),
        },
      },
    ],
    yAxis: [
      {
        position: 'left',
        name: isMobile() || isThumbnail ? '' : i18n.t('statistic.circulation_supply'),
        nameTextStyle: {
          align: 'left',
        },
        type: 'value',
        scale: true,
        axisLine: {
          lineStyle: {
            color: ChartColors[0],
          },
        },
        axisLabel: {
          formatter: (value: string) => handleAxis(value),
        },
      },
    ],
    series: [
      {
        name: i18n.t('statistic.circulation_supply'),
        type: 'line',
        yAxisIndex: '0',
        symbol: isThumbnail ? 'none' : 'circle',
        symbolSize: 3,
        data: statisticCirculationSupply.map(data => new BigNumber(data.circulatingSupply).toFixed(0)),
      },
    ],
  }
}

export const CirculationSupplyChart = ({
  statisticCirculationSupply,
  isThumbnail = false,
}: {
  statisticCirculationSupply: State.StatisticCirculationSupply[]
  isThumbnail?: boolean
}) => {
  if (!statisticCirculationSupply || statisticCirculationSupply.length === 0) {
    return <ChartLoading show={statisticCirculationSupply === undefined} isThumbnail={isThumbnail} />
  }
  return <ReactChartCore option={getOption(statisticCirculationSupply, isThumbnail)} isThumbnail={isThumbnail} />
}

export const initStatisticCirculationSupply = (dispatch: AppDispatch) => {
  dispatch({
    type: PageActions.UpdateStatisticCirculationSupply,
    payload: {
      statisticCirculationSupply: undefined,
    },
  })
}

export default () => {
  const dispatch = useDispatch()
  const { statisticCirculationSupply } = useAppState()

  useEffect(() => {
    initStatisticCirculationSupply(dispatch)
    getStatisticCirculationSupply(dispatch)
  }, [dispatch])

  return (
    <ChartPage title={i18n.t('statistic.circulation_supply_title')}>
      <CirculationSupplyChart statisticCirculationSupply={statisticCirculationSupply} />
    </ChartPage>
  )
}
