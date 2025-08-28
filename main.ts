import { debounce } from "jsr:@std/async/debounce";

if (Deno.args.includes("--help") || Deno.args.includes("-h")) {
  console.log("File Watcher - Monitor git changes in real-time");
  console.log("Usage: deno run --allow-read --allow-run main.ts [directory]");
  console.log("  directory: Directory to watch (default: current directory)");
  Deno.exit(0);
}

const directoryName: string = Deno.args[0] || ".";

const checkGitRepository = async (): Promise<boolean> => {
  try {
    const command = new Deno.Command("git", {
      args: ["rev-parse", "--git-dir"],
    });
    const { success } = await command.output();
    return success;
  } catch {
    return false;
  }
};

if (!(await checkGitRepository())) {
  console.error(
    "Error: Not a git repository. Please run this tool in a git repository.",
  );
  Deno.exit(1);
}

const watcher = Deno.watchFs(directoryName);

const primaryColor = "#0dba3b";
const secondaryColor = "#fcba03";
const tertiaryColor = "#f44336";
const SMALL_CHANGE_THRESHOLD = 10;
const MEDIUM_CHANGE_THRESHOLD = 20;
let hasHadChanges = false;

const initMessage = () => {
  console.clear();
  console.log(
    "%cWatching for Changes",
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

  if (messageLength <= SMALL_CHANGE_THRESHOLD) return primaryColor;
  if (messageLength <= MEDIUM_CHANGE_THRESHOLD) return secondaryColor;
  return tertiaryColor;
};

const runGitDiff = async () => {
  const command = new Deno.Command("git", {
    args: ["diff", "--stat"],
  });

  const { success, stdout, stderr } = await command.output();
  if (!success) {
    console.error("Git command failed:", new TextDecoder().decode(stderr));
    return;
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
