import { debounce } from "jsr:@std/async/debounce";

const directoryName: string = Deno.args[0] || ".";
const watcher = Deno.watchFs(directoryName);

const command = new Deno.Command("git", {
  args: ["diff --stat"],
});

const debouncedLog = debounce((command: string) => {
  console.log(command);
}, 200);

for await (const _event of watcher) {
  const { success, stdout } = await command.output();

  if (!success) {
    console.error("Failed to execute command");
    Deno.exit(1);
  }

  const decodedMessage = new TextDecoder().decode(stdout);
  debouncedLog(decodedMessage);
}
