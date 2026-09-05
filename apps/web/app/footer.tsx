export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-white py-5">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-6 text-sm text-muted">
        <span>
          Powered By —{" "}
          <a
            href="https://www.kmr-groups.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            KMR Group of Companies
          </a>
        </span>
      </div>
    </footer>
  );
}
