import { seededShuffle } from '@/lib/utils';

export const QUESTION_OCEAN_FILES = [
  '01-turtle.png', '02-seahorse.png', '03-jellyfish.png', '04-sea-star.png', '05-reef-fish-pair.png',
  '06-octopus.png', '07-hermit-crab.png', '08-ray.png', '09-spotted-reef-fish.png', '10-pufferfish.png',
  '11-sea-slug.png', '12-squid.png', '13-scallop.png', '14-shrimp.png', '15-anemone.png',
  '16-sunfish.png', '17-crab.png', '18-butterflyfish.png', '19-cuttlefish.png', '20-urchin.png',
  '21-penguin.png', '22-lobster.png', '23-anchovies.png', '24-nautilus.png', '25-sea-hare.png',
  '26-manta-ray.png', '27-moon-jellyfish.png', '28-resting-turtle.png', '29-blenny.png', '30-sand-dollar.png',
] as const;
export const QUESTION_OCEAN_SCENE_COUNT = QUESTION_OCEAN_FILES.length;

/** A separate permutation avoids repeats and retains each scene on back/resume. */
export function getQuestionOceanScene(seed: number, questionIndex: number): number {
  const scenes = seededShuffle(
    Array.from({ length: QUESTION_OCEAN_SCENE_COUNT }, (_, index) => index),
    seed + 74291,
  );
  return scenes[Math.max(0, questionIndex) % scenes.length];
}
