interface Props {
  html: string;
  style?: object;
}

export default function LeafletMap({ html, style }: Props) {
  return (
    <iframe
      srcDoc={html}
      style={{ ...(style as any), border: 'none', display: 'block', width: '100%', height: '100%' }}
      sandbox="allow-scripts allow-same-origin"
    />
  ) as any;
}
