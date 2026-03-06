import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';

export function useTreeZoom(svgRef, initialScale = 0.7) {
  const zoomBehavior = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(initialScale);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        svg.select('g.tree-root').attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);
    zoomBehavior.current = zoom;

    // Set initial transform
    const bounds = svgRef.current.getBoundingClientRect();
    const initTransform = d3.zoomIdentity
      .translate(bounds.width / 2, 60)
      .scale(initialScale);
    svg.call(zoom.transform, initTransform);

    return () => {
      svg.on('.zoom', null);
    };
  }, [svgRef, initialScale]);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehavior.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehavior.current.scaleBy, 1.5);
  }, [svgRef]);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehavior.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehavior.current.scaleBy, 0.667);
  }, [svgRef]);

  const resetView = useCallback(() => {
    if (!svgRef.current || !zoomBehavior.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const resetTransform = d3.zoomIdentity
      .translate(bounds.width / 2, 60)
      .scale(initialScale);
    d3.select(svgRef.current)
      .transition()
      .duration(600)
      .ease(d3.easeCubicInOut)
      .call(zoomBehavior.current.transform, resetTransform);
  }, [svgRef, initialScale]);

  const panToNode = useCallback((x, y) => {
    if (!svgRef.current || !zoomBehavior.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const transform = d3.zoomIdentity
      .translate(bounds.width / 2 - x * 1.2, bounds.height / 3 - y * 1.2)
      .scale(1.2);
    d3.select(svgRef.current)
      .transition()
      .duration(800)
      .ease(d3.easeCubicInOut)
      .call(zoomBehavior.current.transform, transform);
  }, [svgRef]);

  return { zoomLevel, zoomIn, zoomOut, resetView, panToNode };
}
