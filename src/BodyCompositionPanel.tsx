import React, { useRef, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { BodyMetricsOptions } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory } from '@grafana/ui';
import { round } from 'lodash';
import * as d3 from 'd3';

interface Props extends PanelProps<BodyMetricsOptions> {}

/* 
SELECT
  $__time("measurementDate"),
  weight,
    ("fatPercentage" * 0.01) * weight as "fatMass",
  "muscleMass",
  "boneMass",
  "waterPercentage",
  "proteinPercentage"
FROM
  measurements
WHERE
  $__timeFilter("measurementDate")
ORDER BY "measurementDate"
*/

export const BodyCompositionPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const styles = getStyles();
  const d3Container = useRef(null);

  useEffect(() => {
    if (data.series.length > 1) {
      console.log('Please only use one series for this panel. We only use data from one query.');
    }

    const stackPalette: { [key: string]: string } = {
      fatMass: '#F8D300',
      muscleMass: '#D5082F',
      boneMass: '#F7F7F7',
      etcMass: '#10A210',
    };

    const linePalette = {
      proteinPerc: '#9D1CE8',
      waterPerc: '#0465DF',
    };

    const chartMargins = { top: 0, left: 40, right: 0, bottom: 40 };

    const unitModifier = options.unit === 'kgs' ? 1 : 2.2;

    const dataFrames = data.series[0];
    const dataTime = dataFrames.fields.find((frame) => frame.name === 'Time');

    const dataWeight = dataFrames.fields.find((frame) => frame.name === options.weightLbl);

    const dataFatMass = dataFrames.fields.find((frame) => frame.name === options.fatMassLbl);
    const dataMuscleMass = dataFrames.fields.find((frame) => frame.name === options.muscleMassLbl);
    const dataBoneMass = dataFrames.fields.find((frame) => frame.name === options.boneMassLbl);
    //const etcLabel = options.etcMassLbl;

    const dataWaterPerc = dataFrames.fields.find((frame) => frame.name === options.waterPercLbl);
    const dataProteinPerc = dataFrames.fields.find((frame) => frame.name === options.proteinPercLbl);

    const areaData: any = dataTime?.values.toArray().map((time, i) => {
      let datum = {
        time: time,
        weight: round(dataWeight?.values.get(i) * unitModifier, 2),
        fatMass: round(dataFatMass?.values.get(i) * unitModifier, 2),
        muscleMass: round(dataMuscleMass?.values.get(i) * unitModifier, 2),
        boneMass: round(dataBoneMass?.values.get(i) * unitModifier, 2),
        waterPerc: round(dataWaterPerc?.values.get(i) * unitModifier, 2),
        proteinPerc: round(dataProteinPerc?.values.get(i) * unitModifier, 2),
        etcMass: 0,
      };
      datum.etcMass = datum.weight - datum.fatMass - datum.muscleMass - datum.boneMass;
      return datum;
    });

    const svg = d3.select(d3Container.current);
    const chartG = svg.selectAll('g.mainChart').data([1]).enter().append('g').classed('mainChart', true);
    const xRange = [chartMargins.left, width - chartMargins.right];
    const yRange = [height - chartMargins.bottom, chartMargins.top];

    const metricsStack = d3.stack().keys(Object.keys(stackPalette)).order(d3.stackOrderNone).offset(d3.stackOffsetNone);

    const series = metricsStack(areaData);
    const timeRange = d3.extent<[number, number], number>(areaData, (d: any) => d.time);
    const weightMax = d3.max<[number, number], number>(areaData, (d: any) => d.weight);

    const x = d3
      .scaleTime()
      .domain([timeRange[0] as number, timeRange[1] as number])
      .range(xRange);

    const y = d3
      .scaleLinear<number, number>()
      .domain([0, weightMax as number])
      .range(yRange);

    const xAxis = d3.axisBottom(x).tickSizeOuter(0);
    const yAxis = d3.axisLeft(y).ticks(height / 40);

    let area = d3
      .area<any>()
      .x((d: any, i: number) => {
        return x(d.data.time);
      })
      .y0((d: any) => {
        return y(d[0]);
      })
      .y1((d: any) => {
        return y(d[1]);
      });

    const waterPercLine = d3
      .line()
      .x((d: any, i: number) => {
        return x(d.time);
      })
      .y((d: any) => {
        return y(d.waterPerc * 0.01 * d.weight);
      });

    const proteinPercLine = d3
      .line()
      .x((d: any, i: number) => {
        return x(d.time);
      })
      .y((d: any) => {
        return y(d.proteinPerc * 0.01 * d.weight);
      });

    const stackMassLine = d3
      .line()
      .x((d: any, i: number) => {
        return x(d.data.time);
      })
      .y((d: any) => {
        return y(d[1]);
      });

    chartG
      .selectAll('path.stackedComp')
      .data(series)
      .enter()
      .append('path')
      .attr('d', area)
      .classed('stackedComp', true)
      .attr('fill', (d) => stackPalette[d.key])
      .attr('fill-opacity', '0.6');

    chartG
      .selectAll('path.muscleLine')
      .data(series)
      .enter()
      .append('path')
      .attr('d', stackMassLine(series.find((d) => d.key === 'muscleMass') as any))
      .classed('muscleLine', true)
      .attr('stroke', stackPalette.muscleMass)
      .attr('fill', 'none')
      .attr('stroke-width', 3);

    chartG
      .selectAll('path.fatLine')
      .data(series)
      .enter()
      .append('path')
      .attr('d', stackMassLine(series.find((d) => d.key === 'fatMass') as any))
      .classed('fatLine', true)
      .attr('stroke', stackPalette.fatMass)
      .attr('fill', 'none')
      .attr('stroke-width', 3);

    chartG
      .selectAll('path.boneLine')
      .data(series)
      .enter()
      .append('path')
      .attr('d', stackMassLine(series.find((d) => d.key === 'boneMass') as any))
      .classed('boneLine', true)
      .attr('stroke', stackPalette.boneMass)
      .attr('fill', 'none')
      .attr('stroke-width', 3);

    chartG
      .selectAll('path.waterPerc')
      .data([1])
      .enter()
      .append('path')
      .attr('d', waterPercLine(areaData))
      .classed('waterPerc', true)
      .attr('stroke', linePalette.waterPerc)
      .attr('fill', 'none')
      .attr('stroke-dasharray', '10 5')
      .attr('stroke-width', 3);

    chartG
      .selectAll('path.proteinPerc')
      .data([1])
      .enter()
      .append('path')
      .attr('d', proteinPercLine(areaData))
      .classed('proteinPerc', true)
      .attr('stroke', linePalette.proteinPerc)
      .attr('fill', 'none')
      .attr('stroke-dasharray', '10 5')
      .attr('stroke-width', 3);

    svg
      .selectAll('g.yAxis')
      .data([options.unit])
      .enter()
      .append('g')
      .classed('yAxis', true)
      .attr('transform', `translate(${chartMargins.left},0)`)
      .call(yAxis)
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .clone()
          .attr('x2', width - chartMargins.left - chartMargins.right)
          .attr('stroke-opacity', 0.1)
      )
      .call((g) =>
        g
          .append('text')
          .attr('x', -chartMargins.left)
          .attr('y', 10)
          .attr('fill', 'currentColor')
          .attr('text-anchor', 'start')
          .text((d) => {
            console.log(d);
            return d;
          })
      );

    svg
      .selectAll('g.xAxis')
      .data([1])
      .enter()
      .append('g')
      .classed('xAxis', true)
      .attr('transform', `translate(0,${height - chartMargins.bottom})`)
      .call(xAxis);
  }, [data, options, height, width, d3Container]);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <svg
        ref={d3Container}
        className={styles.svg}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      ></svg>
    </div>
  );
};

const getStyles = stylesFactory(() => {
  return {
    wrapper: css`
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
  };
});
