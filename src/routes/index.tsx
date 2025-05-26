import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-col gap-8 w-full py-8">
      <h1 className="text-4xl font-bold text-center">Rationalist Typeracer</h1>

      <div className="prose lg:prose-xl mx-auto max-w-full">
        <p className="lead">
          Race against other players in real-time typing competitions! 
          Test your speed and accuracy in multiplayer typing races.
        </p>

        <p>
          Challenge yourself and others to see who can type the fastest with 
          the highest accuracy. Practice makes perfect - improve your typing 
          skills while having fun competing with friends.
        </p>

        <p>
          Join a race, type the displayed text as quickly and accurately as 
          possible, and see how you rank against other players. Track your 
          words per minute (WPM) and accuracy in real-time.
        </p>

        <Unauthenticated>
          <div className="flex justify-center mt-8">
            <SignInButton mode="modal">
              <button className="btn btn-primary btn-lg">Get Started</button>
            </SignInButton>
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="flex justify-center gap-4 mt-8">
            <Link to="/race" className="btn btn-primary btn-lg">
              Start Race
            </Link>
          </div>
        </Authenticated>
      </div>
    </div>
  );
}
