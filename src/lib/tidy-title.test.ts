import { describe, expect, it } from "vitest";
import { tidyTitle } from "./tidy-title";

describe("tidyTitle", () => {
  it("turns a title typed in capitals into capital first letters", () => {
    expect(tidyTitle("SALE WATER PARK CIRCULAR")).toBe("Sale Water Park Circular");
    expect(tidyTitle("BOGGART HOLE CLOUGH WELLBEING WALK")).toBe("Boggart Hole Clough Wellbeing Walk");
    expect(tidyTitle("WALK TO THE TOWER AND BACK")).toBe("Walk to the Tower and Back");
    expect(tidyTitle("THE PEEL MONUMENT")).toBe("The Peel Monument");
  });
  it("keeps names and words with numbers", () => {
    expect(tidyTitle("NHS FUN WALK 5KM")).toBe("NHS Fun Walk 5KM");
    expect(tidyTitle("RAMSBOTTOM-HOLCOMBE LOOP")).toBe("Ramsbottom-Holcombe Loop");
  });
  it("fixes only long capital words in an otherwise normal title", () => {
    expect(tidyTitle("Daisy Nook, HARTSHEAD PIKE circular")).toBe("Daisy Nook, Hartshead Pike circular");
    expect(tidyTitle("RSPB walk at Burrs")).toBe("RSPB walk at Burrs");
  });
  it("leaves normal titles exactly as typed", () => {
    for (const t of ["Moses Gate Country Park", "Slattocks / Tandle Hill Circular", "Wince Brook Nature park Wellbeing Circular", "Christmas walk 🎄", "Walk at 10am"]) {
      expect(tidyTitle(t)).toBe(t);
    }
  });
});
