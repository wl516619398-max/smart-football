import { buildAnalysisPrompt, getAnalysisDataset } from "../lib/analysis-engine/analysis_prompt_builder.ts";

const matchId = process.argv.find((argument) => argument.startsWith("--match-id="))?.slice("--match-id=".length);

async function main() {
  const datasets = await getAnalysisDataset(matchId);
  if (!datasets.length) {
    console.info(`[analysis-prompt] no dataset found${matchId ? ` for ${matchId}` : ""}`);
    return;
  }

  const prompts = datasets.map(buildAnalysisPrompt);
  const first = prompts[0];
  console.info(`[analysis-prompt] datasets=${datasets.length} prompts=${prompts.length}`);
  console.info(`[analysis-prompt] match_id=${first.match_id} version=${first.version}`);
  console.info(`[analysis-prompt] missing_fields=${first.missing_fields.length ? first.missing_fields.join(",") : "none"}`);
  console.info(`[analysis-prompt] system_chars=${first.system_prompt.length} user_chars=${first.user_prompt.length}`);
  console.info("[analysis-prompt] prompt generation passed");
}

main().catch((error) => {
  console.error("[analysis-prompt] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
