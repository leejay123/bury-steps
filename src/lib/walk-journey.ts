export const MAX_JOURNEY_EVENTS = 20;
export const MAX_JOURNEY_TITLE = 80;
export const MAX_JOURNEY_BODY = 500;

export type JourneyEventView = {
  id: string;
  title: string;
  body: string | null;
  happenedAt: string;
};
