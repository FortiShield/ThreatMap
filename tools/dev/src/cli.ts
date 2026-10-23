import { Command } from "commander";

import { buildCommand } from "./commands/build.js";
import { watchCommand } from "./commands/watch.js";

const program = new Command();

program
  .name("threatmap-dev")
  .description("Development toolkit for building ThreatMap plugins")
  .version("0.0.0");

program.addCommand(buildCommand);
program.addCommand(watchCommand);

const run = async (): Promise<void> => {
  await program.parseAsync(process.argv);
};

void run();
