import { format, t } from '../../common';
import { ButtonConfig } from './config.Button';
import { HrConfig } from './config.Hr';
import { TitleConfig } from './config.Title';

/**
 * A [Group] configurator.
 */
export function GroupConfig(params: any[]) {
  const item: t.ActionItemGroup = { type: 'group', name: 'Unnamed', items: [] };

  const config: t.ActionGroupConfigArgs<any> = {
    name(value) {
      item.name = format.string(value, { trim: true }) || 'Unnamed';
      return config;
    },

    button(...params: any[]) {
      item.items.push(ButtonConfig(params).item);
      return config as any;
    },

    hr(...params: any[]) {
      item.items.push(HrConfig(params).item);
      return config as any;
    },

    title(...params: any[]) {
      item.items.push(TitleConfig(params).item);
      return config as any;
    },
  };

  if (typeof params[0] === 'function') {
    params[0](config);
  } else {
    if (typeof params[0] === 'string') {
      config.name(params[0]);
    }
    if (typeof params[1] === 'function') {
      params[1](config);
    }
  }

  return { item, config };
}
