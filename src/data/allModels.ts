import { aiModels } from './aiModels';
import { additionalModels } from './moreModels';
import { extendedModels } from './extendedModels';
import { finalModels } from './finalModels';
import { extraModels } from './extraModels';
import { lastModels } from './lastModels';

export const allAIModels = [
  ...aiModels,
  ...additionalModels,
  ...extendedModels,
  ...finalModels,
  ...extraModels,
  ...lastModels
];

export const allModels = allAIModels;

export * from './aiModels';
