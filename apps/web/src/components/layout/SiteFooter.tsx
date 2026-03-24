export function SiteFooter(): React.ReactNode {
  return (
    <footer className="site-footer" aria-label="Site copyright">
      <p className="site-footer__copy">
        ©2026 All rights reserved.{' '}
        <a
          className="site-footer__link"
          href="https://garycartlidge.art/"
          target="_blank"
          rel="noreferrer"
        >
          Gary Cartlidge
        </a>{' '}
        &amp;{' '}
        <a
          className="site-footer__link"
          href="https://www.fantomlabs.io/"
          target="_blank"
          rel="noreferrer"
        >
          fantom labs technology
        </a>
        .
      </p>
    </footer>
  );
}
