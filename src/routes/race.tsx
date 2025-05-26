import { createFileRoute } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { TypingArea } from "../components/TypingArea";

export const Route = createFileRoute("/race")({
  component: RacePage,
});

function RacePage() {
  return (
    <Authenticated>
      <div className="flex flex-col gap-8 w-full py-8">
        <h1 className="text-4xl font-bold text-center">Typeracer</h1>
        <div className="max-w-4xl mx-auto w-full">
          <TypingArea />
        </div>
      </div>
    </Authenticated>
  );
}