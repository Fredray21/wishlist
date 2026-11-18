import "server-only";
import { parseBirthdayMonth } from "./themes";

export function getSiteConfig() {
  return {
    ownerName: (process.env.OWNER_NAME || "Frédéric").trim(),
    birthdayMonth: parseBirthdayMonth(process.env.BIRTHDAY_MONTH),
  };
}
