import React, { useRef, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { BodyMetricsOptions } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory } from '@grafana/ui';
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
        weight: dataWeight?.values.get(i).toFixed(2),
        fatMass: dataFatMass?.values.get(i).toFixed(2),
        muscleMass: dataMuscleMass?.values.get(i).toFixed(2),
        boneMass: dataBoneMass?.values.get(i).toFixed(2),
        waterPerc: dataWaterPerc?.values.get(i).toFixed(2),
        proteinPerc: dataProteinPerc?.values.get(i).toFixed(2),
        etcMass: 0,
      };
      datum.etcMass = datum.weight - datum.fatMass - datum.muscleMass - datum.boneMass;
      return datum;
    });

    const svg = d3.select(d3Container.current);

    const metricsStack = d3
      .stack()
      .keys(['fatMass', 'muscleMass', 'boneMass', 'etcMass'])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = metricsStack(areaData);
    const timeRange = d3.extent<[number, number], number>(areaData, (d: any) => d.time);
    const weightMax = d3.max<[number, number], number>(areaData, (d: any) => d.weight);

    var x = d3
      .scaleTime()
      .domain([timeRange[0] as number, timeRange[1] as number])
      .range([0, width]);

    var y = d3
      .scaleLinear<number, number>()
      .domain([0, weightMax as number])
      .range([height, 0]);

    var fillColor = d3.scaleQuantize<string, number>().domain([0, 3]).range(['yellow', 'red', 'orange', 'green']);

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

    svg
      .selectAll('path.stackedComp')
      .data(series)
      .enter()
      .append('path')
      .attr('d', area)
      .classed('stackedComp', true)
      .attr('fill', (d: any, i: number) => fillColor(i));

    svg
      .selectAll('path.proteinPerc')
      .data([1])
      .enter()
      .append('path')
      .attr('d', waterPercLine(areaData))
      .classed('waterPerc', true)
      .attr('stroke', 'blue')
      .attr('fill', 'none')
      .attr('stroke-dasharray', '10 5')
      .attr('stroke-width', 3);

    svg
      .selectAll('path.proteinPerc')
      .data([1])
      .enter()
      .append('path')
      .attr('d', proteinPercLine(areaData))
      .classed('proteinPerc', true)
      .attr('stroke', 'violet')
      .attr('fill', 'none')
      .attr('stroke-dasharray', '10 5')
      .attr('stroke-width', 3);
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
