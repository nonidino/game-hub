import { useState } from "react";
import { useRoom } from "../../games/engine/useRoom";
import { GameLayout } from "../../games/engine/GameShell";
import {
  pcInitial,
  chainFor,
  currentWordIndex,
  visibleLetters,
  applyGuess,
  applyReveal,
  otherSeat,
  CHAIN_LEN,
  type PCState,
  type SolveProgress,
} from "../../games/phrase/logic";
import type { SeatId } from "../../games/engine/types";

const EXAMPLE = ["bottled", "water", "board", "game", "night", "owl"];

export default function PhrasePage() {
  const room = useRoom<PCState>("phrase", pcInitial);
  const data = room.data;
  const seat = room.mySeat;

  const [words, setWords] = useState<string[]>(Array(CHAIN_LEN).fill(""));
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState(false);

  const phase = data?.game.phase ?? "setup";
  const myChainSet = seat ? Boolean(data?.game.chains[seat]) : false;
  const myTurn = room.isMyTurn && room.bothJoined;

  function submitChain() {
    if (!seat) return;
    if (words.some((w) => !w.trim())) return;
    const clean = words.map((w) => w.trim());
    room.update((prev) => {
      const chains = { ...prev.game.chains, [seat]: clean };
      const bothSet = Boolean(chains.p1 && chains.p2);
      return {
        ...prev,
        game: { ...prev.game, chains, phase: bothSet ? "solve" : "setup" },
        turn: bothSet ? "p1" : prev.turn,
      };
    });
  }

  function act(kind: "guess" | "reveal") {
    if (!seat || !myTurn || !data) return;
    const chain = chainFor(data.game, seat);
    if (!chain) return;
    const p = data.game.progress[seat];
    let np: SolveProgress;
    let keepTurn = false;
    if (kind === "guess") {
      const r = applyGuess(chain, p, guess);
      np = r.progress;
      keepTurn = r.correct;
      if (!r.correct) {
        setWrong(true);
        setTimeout(() => setWrong(false), 800);
      }
      setGuess("");
    } else {
      np = applyReveal(chain, p);
    }
    room.update((prev) => {
      const progress = { ...prev.game.progress, [seat]: np };
      const bothDone = progress.p1.done && progress.p2.done;
      let winner = prev.winner;
      let gphase = prev.game.phase;
      let turn = prev.turn;
      if (bothDone) {
        gphase = "done";
        const h1 = progress.p1.hints;
        const h2 = progress.p2.hints;
        winner = h1 === h2 ? "draw" : h1 < h2 ? "p1" : "p2";
      } else {
        turn = keepTurn
          ? seat
          : progress[otherSeat(seat)].done
          ? seat
          : otherSeat(seat);
      }
      return { ...prev, game: { ...prev.game, progress, phase: gphase }, winner, turn };
    });
  }

  function newGame() {
    setWords(Array(CHAIN_LEN).fill(""));
    setGuess("");
    room.reset(pcInitial(), "p1");
  }

  // ---- status ----
  let status = "Build a word chain, then solve your partner's 🔗";
  if (data) {
    if (phase === "setup") {
      status = myChainSet
        ? "Chain locked in! Waiting for your partner to build theirs…"
        : "Secretly build your 6-word phrase chain below.";
    } else if (phase === "done") {
      status =
        data.winner === "draw"
          ? "It's a tie! 🤝"
          : `${data.players[data.winner as SeatId]?.name ?? "Someone"} solved with fewer hints — winner! 🎉`;
    } else {
      status = myTurn ? "Your turn — guess a word or take a hint." : `${data.players[data.turn ?? "p1"]?.name ?? "Partner"}'s turn…`;
    }
  }

  return (
    <GameLayout
      emoji="🔗"
      title="Phrase Chain"
      room={room}
      status={status}
      onNewGame={newGame}
      howTo={
        <>
          <p>
            Pick a start word, then 5 more so each <em>neighbouring pair</em> makes a
            phrase — e.g. <strong>bottled→water→board→game→night→owl</strong>.
          </p>
          <p>
            Your partner sees the full first word and just the first letter of the
            rest. On your turn: guess the next word (correct = keep your turn) or
            reveal a letter (a hint — passes the turn).
          </p>
          <p>When you both finish, fewer hints wins.</p>
        </>
      }
    >
      {!seat && <p className="text-center text-ink-soft">You're spectating.</p>}

      {/* SETUP */}
      {seat && phase === "setup" && !myChainSet && (
        <div className="max-w-lg mx-auto space-y-3">
          {words.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-right text-ink-soft text-sm">{i + 1}.</span>
              <input
                value={w}
                onChange={(e) => {
                  const next = words.slice();
                  next[i] = e.target.value;
                  setWords(next);
                }}
                placeholder={i === 0 ? `start word (e.g. ${EXAMPLE[0]})` : `${EXAMPLE[i]}`}
                className="flex-1 rounded-full border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea"
              />
              {i < words.length - 1 && <span className="text-ink-soft text-xs">+</span>}
            </div>
          ))}
          <p className="text-xs text-ink-soft text-center">
            Each word + the next should form a real phrase.
          </p>
          <button
            onClick={submitChain}
            className="btn btn-love w-full"
            disabled={words.some((w) => !w.trim())}
          >
            Lock in my chain 🔒
          </button>
        </div>
      )}

      {seat && phase === "setup" && myChainSet && (
        <p className="text-center text-sea-deep">
          ✅ Your chain is set. Waiting for your partner…
        </p>
      )}

      {/* SOLVE / DONE */}
      {seat && (phase === "solve" || phase === "done") && data && (
        <div className="grid md:grid-cols-2 gap-6">
          <SolvePanel data={data} seat={seat} />

          <div className="space-y-4">
            {phase === "solve" && myTurn && !data.game.progress[seat].done && (
              <div className="card p-4">
                <div className="text-sm text-ink-soft mb-2">
                  Guess word #{currentWordIndex(data.game.progress[seat]) + 1} in the chain
                </div>
                <div className="flex gap-2">
                  <input
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && act("guess")}
                    placeholder="your guess…"
                    className={`flex-1 rounded-full border px-4 py-2 outline-none focus:ring-2 focus:ring-sea ${
                      wrong ? "border-love bg-rose/40" : "border-rose-2"
                    }`}
                  />
                  <button onClick={() => act("guess")} className="btn btn-love" disabled={!guess.trim()}>
                    Guess
                  </button>
                </div>
                <button onClick={() => act("reveal")} className="btn btn-ghost w-full mt-2 text-sm">
                  💡 Reveal a letter (hint)
                </button>
                {wrong && <p className="text-love-deep text-sm mt-2 text-center">Not quite — try again!</p>}
              </div>
            )}
            {phase === "solve" && data.game.progress[seat].done && (
              <div className="card p-4 text-center text-sea-deep">
                🎉 You finished your chain! Waiting for your partner…
              </div>
            )}

            {/* scoreboard */}
            <div className="card p-4">
              <h3 className="font-bold text-ink mb-2">Progress</h3>
              {(["p1", "p2"] as SeatId[]).map((s) => {
                const pr = data.game.progress[s];
                return (
                  <div key={s} className="flex items-center justify-between text-sm py-1">
                    <span>
                      {data.players[s]?.emoji} {data.players[s]?.name ?? "…"}
                      {data.winner === s && " 👑"}
                    </span>
                    <span className="text-ink-soft">
                      {pr.solvedIndex}/{CHAIN_LEN - 1} solved · {pr.hints} hints
                      {pr.done && " ✓"}
                    </span>
                  </div>
                );
              })}
            </div>

            {phase === "done" && (
              <div className="card p-4">
                <h3 className="font-bold text-ink mb-1">The answer chains</h3>
                {(["p1", "p2"] as SeatId[]).map((s) => (
                  <p key={s} className="text-sm text-ink-soft">
                    {data.players[s]?.name}'s: {(data.game.chains[s] ?? []).join(" → ")}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </GameLayout>
  );
}

function SolvePanel({ data, seat }: { data: NonNullable<ReturnType<typeof useRoom<PCState>>["data"]>; seat: SeatId }) {
  const chain = chainFor(data.game, seat);
  const p = data.game.progress[seat];
  if (!chain) return <p className="text-ink-soft">No chain to solve.</p>;
  const cur = currentWordIndex(p);

  return (
    <div className="card p-4">
      <div className="text-sm text-ink-soft mb-3">
        The chain {data.players[otherSeat(seat)]?.name ?? "your partner"} made for you:
      </div>
      <div className="space-y-2">
        {chain.map((word, idx) => {
          const vis = visibleLetters(word, idx, p);
          const solved = idx === 0 || idx < cur;
          const isCurrent = idx === cur && !p.done;
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-5 text-right text-xs text-ink-soft">{idx + 1}</span>
              <div
                className={`flex gap-1 ${isCurrent ? "scale-105" : ""}`}
              >
                {vis.split("").map((ch, k) => (
                  <span
                    key={k}
                    className={`w-7 h-8 grid place-items-center rounded font-bold uppercase ${
                      solved ? "bg-sea text-white" : "bg-blush-2 text-ink"
                    }`}
                  >
                    {ch}
                  </span>
                ))}
                {!solved && (
                  <span className="w-7 h-8 grid place-items-center rounded bg-blush-2/60 text-ink-soft">
                    ?
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink-soft mt-3">
        Hints used: <strong>{p.hints}</strong>
      </p>
    </div>
  );
}
