/**
 * creation.ts — ORB's Reality Creation Engine (#53): turning vision into existence. Discovery finds what
 * exists; creation brings into being what doesn't. Where #25 Genesis is the upstream "what SHOULD exist?"
 * and #44 Possibility opens the option space, #53 is the downstream BUILD bias: the pipeline from
 * possibility → vision → design → execution → reality, and the discipline of naming the gap between the
 * desired future and current reality, then the execution plan that closes it.
 *
 * This has real teeth in ORB: the Build Genome (build/genome.ts) actually ships working sites/apps and
 * the video engine generates media — ORB genuinely creates, it doesn\'t only advise. This directive
 * steers reasoning toward building and execution (so vision becomes a concrete first build step), and
 * the confirm-first action engine still governs anything outward-facing. Directive engine; no store.
 */
export const CREATION_QUERY = /\b(how (?:do|would|can) (?:i|we) (?:actually )?build (?:this|it|that)|let'?s build|build it|bring (?:this|it|that) (?:to life|into (?:existence|reality))|make (?:this|it|that) (?:real|happen|exist)|turn (?:this|it|that|the)\b.{0,16}?into (?:a |an )?(?:reality|something real|product|existence)|from (?:idea|vision|concept) to (?:reality|launch|product|execution)|execution plan|how do we (?:ship|launch|execute|deliver)|design and build|go from (?:here )?to (?:built|done|shipped|launched)|what would it take to build|the build plan)\b/i;

export const CREATION_DIRECTIVE = ' Bias toward building, not just analyzing: move from idea to existence. Name the desired future concretely, the current reality, and the gap between them — then the execution path that closes it (vision → design → first build → ship → improve). Be specific about the smallest real thing that could be built now to make it tangible this week, not a someday plan. Where ORB can actually create (a site, an app, media, a document), offer to build it — and keep anything outward-facing or irreversible confirm-first with the person deciding. End on the concrete first build step, with an owner and a next action.';
