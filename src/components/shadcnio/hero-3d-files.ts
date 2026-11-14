/**
 * Where the 3D hero look's characters live (public-domain models by Quaternius,
 * slimmed down). Browsers are told to keep these files for good (see the
 * /hero-3d/ entry in next.config.ts), so a file must never be changed in place:
 * put changed or new files in a new numbered folder and change FOLDER to match.
 *
 * Kept apart from the 3D code so the page can ask for the files early without loading it.
 */
const FOLDER = "/hero-3d/2";

export const PEOPLE = ["hiker-man", "hiker-woman", "casual-man", "hoodie-man", "farmer", "casual-woman"] as const;
export const DOG = "husky";

export const characterFile = (name: string) => `${FOLDER}/${name}.glb`;
export const CHARACTER_FILES = [...PEOPLE, DOG].map(characterFile);
