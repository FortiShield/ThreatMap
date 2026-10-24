import { base64Decode, base64Encode, sha256 } from "@threatmap/convert";

const command = process.argv[2];
const subcommand = process.argv[3];
const args = process.argv.slice(4);

function encodeBase64(input: string): void {
  process.stdout.write(`${base64Encode(input)}\n`);
}

function decodeBase64(input: string): void {
  process.stdout.write(`${base64Decode(input)}\n`);
}

async function hashSha256(input: string): Promise<void> {
  process.stdout.write(`${await sha256(input)}\n`);
}

async function main(): Promise<void> {
  if (command === "convert") {
    if (subcommand === "base64-encode") {
      encodeBase64(args[0] ?? "");
    } else if (subcommand === "base64-decode") {
      decodeBase64(args[0] ?? "");
    } else if (subcommand === "hash-sha256") {
      await hashSha256(args[0] ?? "");
    }
  }
}

await main();
