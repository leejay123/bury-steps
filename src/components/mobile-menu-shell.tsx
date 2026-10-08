/**
 * The two lines of the phone menu, drawn before the session is known.
 * The live button replaces it. Same size, so the header does not jump.
 */
export function MobileMenuShell() {
  return (
    <button
      aria-hidden
      className="relative size-8 touch-manipulation items-center justify-center p-0 md:hidden"
      data-mobile-nav=""
      tabIndex={-1}
      type="button"
    >
      <div className="relative flex h-8 w-4 items-center justify-center">
        <div className="relative size-4">
          <span className="absolute top-1 left-0 block h-0.5 w-4 bg-black dark:bg-white" />
          <span className="absolute top-2.5 left-0 block h-0.5 w-4 bg-black dark:bg-white" />
        </div>
      </div>
    </button>
  );
}
