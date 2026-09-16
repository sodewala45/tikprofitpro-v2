import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

import { SITE, OG_IMAGE, routeMeta } from "../../seo-routes";

export default function Seo() {
  const { pathname } = useLocation();
  const key = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const meta = routeMeta[key];
  if (!meta) return null;
  const url = `${SITE}${key === "/" ? "/" : key}`;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
}
