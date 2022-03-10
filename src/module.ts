import { PanelPlugin } from '@grafana/data';
import { BodyMetricsOptions } from './types';
import { BodyCompositionPanel } from './BodyCompositionPanel';

export const plugin = new PanelPlugin<BodyMetricsOptions>(BodyCompositionPanel).setPanelOptions((builder) => {
  return builder
    .addRadio({
      path: 'unit',
      name: 'Unit',
      defaultValue: 'kgs',
      settings: {
        options: [
          { value: 'kgs', label: 'Kgs' },
          { value: 'lbs', label: 'Lbs' },
        ],
      },
    })
    .addTextInput({
      path: 'weightLbl',
      name: 'Weight metric',
      description: 'Value label for overall weight',
      defaultValue: 'weight',
    })
    .addTextInput({
      path: 'fatMassLbl',
      name: 'Fat mass metric',
      description: 'Value label for fat mass',
      defaultValue: 'fatMass',
    })
    .addTextInput({
      path: 'muscleMassLbl',
      name: 'Muscle mass metric',
      description: 'Value label for muscle mass',
      defaultValue: 'muscleMass',
    })
    .addTextInput({
      path: 'boneMassLbl',
      name: 'Bone mass metric',
      description: 'Value label for bone mass',
      defaultValue: 'boneMass',
    })
    .addTextInput({
      path: 'etcMassLbl',
      name: 'Etc mass metric',
      description: 'Value label for anything not bone, fat, or muscle. This is not derived from the data source.',
      defaultValue: 'etc',
    })
    .addTextInput({
      path: 'waterPercLbl',
      name: 'Water % metric',
      description: 'Value label for water percentage. This will be independent of stacked body comp.',
      defaultValue: 'waterPercentage',
    })
    .addTextInput({
      path: 'proteinPercLbl',
      name: 'Protein % metric',
      description: 'Value label for protein percentage. This will be independent of stacked body comp.',
      defaultValue: 'proteinPercentage',
    });
});
