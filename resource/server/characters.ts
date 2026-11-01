import { onCharacter } from "@aicore-fivem/lib/server";
import { sizes } from "./content";

// Also replays the characters loaded before this script (re)started.
onCharacter({
  loaded: (source, character) => sizes.load(source, character),
  unloaded: (source) => sizes.unload(source),
});
