import { debounce } from "jsr:@std/async/debounce";

const directoryName: string = Deno.args[0] || ".";
const watcher = Deno.watchFs(directoryName);

const primaryColor = "#0dba3b";
const secondaryColor = "#fcba03";
const tertiaryColor = "#f44336";
let hasHadChanges;

const initMessage = () => {
  console.clear();
  console.log(
    "%cWatching for Changes 👀",
    "background-color: white; color: black; font-weight: bold;",
  );
};

const getColor = (message: string) => {
  const messageLength = message.trim().split("\n").length;
  if (messageLength === 1) {
    hasHadChanges = false;
    return null;
  }

  hasHadChanges = true;

  if (messageLength <= 10) return primaryColor;
  if (messageLength <= 20) return secondaryColor;
  return tertiaryColor;
};

const runGitDiff = async () => {
  const command = new Deno.Command("git", {
    args: ["diff", "--stat"],
  });

  const { success, stdout } = await command.output();
  if (!success) {
    console.error("Failed to execute command");
    Deno.exit(0);
  }

  const decodedMessage = new TextDecoder().decode(stdout);
  const color = getColor(decodedMessage);
  if (!color) {
    initMessage();
    return;
  }

  console.clear();
  console.log(
    "%cDiff 📝",
    `color: black; background-color: ${color}; font-weight: bold;`,
  );
  console.log(decodedMessage);
};

const debouncedGitDiff = debounce(runGitDiff, 200);

runGitDiff();
for await (const _event of watcher) {
  debouncedGitDiff();
}
