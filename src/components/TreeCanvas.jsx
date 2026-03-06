import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { BADGE_MAP, CLAN_COLORS } from '../data/clanData';
import mirmetinImg from '../../assets/generated-image-1772805791740.PNG';

export default function TreeCanvas({ svgRef, clanTree, seedlings, mothersMap, onSelectPerson, onAddPerson }) {
  const hierarchy = useMemo(() => {
    if (!clanTree) return null;
    return d3.hierarchy(clanTree, (d) => d.children);
  }, [clanTree]);

  const expandedWives = useRef(new Set());

  useEffect(() => {
    if (!svgRef.current || !hierarchy) return;
    const svg = d3.select(svgRef.current);

    // Clear previous render before redrawing
    svg.selectAll('*').remove();

    // ── SVG Defs ──
    const defs = svg.append('defs');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'blur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Founder glow
    const founderGlow = defs.append('filter').attr('id', 'founderGlow').attr('x', '-80%').attr('y', '-80%').attr('width', '260%').attr('height', '260%');
    founderGlow.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
    const fgMerge = founderGlow.append('feMerge');
    fgMerge.append('feMergeNode').attr('in', 'blur');
    fgMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Shadow
    const shadow = defs.append('filter').attr('id', 'nodeShadow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    shadow.append('feDropShadow').attr('dx', 0).attr('dy', 3).attr('stdDeviation', 4).attr('flood-color', 'rgba(0,0,0,0.4)');

    // Radial gradients for nodes
    ['Kapmirmet', 'Kapcheboin'].forEach((clan) => {
      const c = CLAN_COLORS[clan];
      const grad = defs.append('radialGradient').attr('id', `nodeGrad-${clan}`);
      grad.append('stop').attr('offset', '0%').attr('stop-color', c.leaf);
      grad.append('stop').attr('offset', '100%').attr('stop-color', c.primary);

      const femGrad = defs.append('radialGradient').attr('id', `femGrad-${clan}`);
      femGrad.append('stop').attr('offset', '0%').attr('stop-color', '#D4A892');
      femGrad.append('stop').attr('offset', '100%').attr('stop-color', '#C9917B');
    });

    // Founder gradient
    const fGrad = defs.append('radialGradient').attr('id', 'founderGrad');
    fGrad.append('stop').attr('offset', '0%').attr('stop-color', '#FFD700');
    fGrad.append('stop').attr('offset', '60%').attr('stop-color', '#DAA520');
    fGrad.append('stop').attr('offset', '100%').attr('stop-color', '#B8860B');

    // Clip path for founder portrait
    defs.append('clipPath').attr('id', 'founderClip')
      .append('circle').attr('r', 28);

    // Clip paths for person photos
    hierarchy.descendants().forEach((d) => {
      if (d.data.photo_url) {
        const r = d.data.badge === 'founder' ? 28 : d.data.badge ? 19 : 15;
        defs.append('clipPath').attr('id', `photo-clip-${d.data.id}`)
          .append('circle').attr('r', r);
      }
    });

    // ── Layout ──
    const treeLayout = d3.tree()
      .nodeSize([90, 140])
      .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.8));

    treeLayout(hierarchy);

    // ── Main group ──
    let g = svg.select('g.tree-root');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'tree-root');
    }
    // Reapply the stored D3 zoom transform so position doesn't jump after redraw
    g.attr('transform', d3.zoomTransform(svgRef.current));

    // ── Draw links (branches) ──
    const linkGenerator = d3.linkVertical()
      .x((d) => d.x)
      .y((d) => d.y);

    g.selectAll('.branch')
      .data(hierarchy.links())
      .enter()
      .append('path')
      .attr('class', 'branch')
      .attr('d', (d) => {
        const s = d.source;
        const t = d.target;
        // Custom organic curve
        const midY = (s.y + t.y) / 2;
        const offsetX = (t.x - s.x) * 0.15;
        return `M${s.x},${s.y}
                C${s.x + offsetX},${midY}
                 ${t.x - offsetX},${midY}
                 ${t.x},${t.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (d.target.data.is_maternal) return '#6B5A4E';
        const clan = d.target.data.clan || 'Kapmirmet';
        return CLAN_COLORS[clan]?.branch || '#654321';
      })
      .attr('stroke-width', (d) => {
        if (d.target.data.is_maternal) return 1.5;
        return Math.max(1.5, 7 - d.target.depth * 1);
      })
      .attr('opacity', (d) => d.target.data.is_maternal ? 0.35 : 0.6)
      .attr('stroke-linecap', 'round')
      .each(function (d) {
        const path = d3.select(this);
        const isMat = d.target.data.is_maternal;
        const len = this.getTotalLength();
        path
          .attr('stroke-dasharray', len)
          .attr('stroke-dashoffset', len)
          .transition()
          .duration(1500)
          .delay((_, i) => i * 30)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0)
          .on('end', function () {
            // Solid for normal branches, dashed for maternal connections
            d3.select(this).attr('stroke-dasharray', isMat ? '5,6' : null);
          });
      });

    // ── Badge tooltip ──
    const tooltip = d3.select('body').append('div')
      .style('position', 'fixed')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('transition', 'opacity 0.15s ease')
      .style('background', 'rgba(13,9,6,0.97)')
      .style('border', '1px solid rgba(139,105,20,0.5)')
      .style('border-radius', '10px')
      .style('padding', '10px 14px')
      .style('max-width', '220px')
      .style('z-index', '9999')
      .style('box-shadow', '0 8px 32px rgba(0,0,0,0.6)');

    // ── Branch hover state ──
    const plusMap = new Map();
    let branchHoverTimer = null;

    // Wide transparent hit areas for easier branch hovering
    g.selectAll('.branch-hitarea')
      .data(hierarchy.links())
      .enter()
      .append('path')
      .attr('class', 'branch-hitarea')
      .attr('d', (d) => {
        const s = d.source;
        const t = d.target;
        const midY = (s.y + t.y) / 2;
        const offsetX = (t.x - s.x) * 0.15;
        return `M${s.x},${s.y} C${s.x + offsetX},${midY} ${t.x - offsetX},${midY} ${t.x},${t.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 20)
      .on('mouseenter', function (event, d) {
        clearTimeout(branchHoverTimer);
        const el = plusMap.get(d.source.data.id + '-' + d.target.data.id);
        if (el) d3.select(el).style('opacity', 1).style('pointer-events', 'all');
      })
      .on('mouseleave', function (event, d) {
        const key = d.source.data.id + '-' + d.target.data.id;
        branchHoverTimer = setTimeout(() => {
          const el = plusMap.get(key);
          if (el) d3.select(el).style('opacity', 0).style('pointer-events', 'none');
        }, 150);
      });

    // ── Draw nodes ──
    const nodes = g
      .selectAll('.node')
      .data(hierarchy.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .on('click', (event, d) => {
        event.stopPropagation();
        onSelectPerson(d.data);
      });

    // Fade in nodes
    nodes
      .transition()
      .duration(600)
      .delay((d, i) => 400 + i * 40)
      .style('opacity', 1);

    // Hover ring
    nodes
      .append('circle')
      .attr('class', 'hover-ring')
      .attr('r', (d) => (d.data.badge === 'founder' ? 38 : d.data.badge ? 26 : 22))
      .attr('fill', 'none')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 3);

    nodes.on('mouseenter', function (event, d) {
      const ring = d3.select(this).select('.hover-ring');
      const clan = d.data.clan || 'Kapmirmet';
      ring
        .transition()
        .duration(200)
        .attr('stroke', CLAN_COLORS[clan]?.leaf || '#DAA520')
        .attr('stroke-opacity', 0.5)
        .attr('r', (d.data.badge === 'founder' ? 42 : d.data.badge ? 30 : 26));
    });

    nodes.on('mouseleave', function () {
      d3.select(this).select('.hover-ring')
        .transition()
        .duration(300)
        .attr('stroke', 'transparent')
        .attr('r', (d) => (d.data?.badge === 'founder' ? 38 : d.data?.badge ? 26 : 22));
    });

    // Main circle
    nodes
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', (d) => {
        if (d.data.badge === 'founder') return 30;
        if (d.data.badge) return 20;
        return 16;
      })
      .attr('fill', (d) => {
        if (d.data.badge === 'founder') return 'url(#founderGrad)';
        if (d.data.is_maternal) return '#6B5040';
        const clan = d.data.clan || 'Kapmirmet';
        return d.data.gender === 'F' ? `url(#femGrad-${clan})` : `url(#nodeGrad-${clan})`;
      })
      .attr('stroke', (d) => {
        if (d.data.badge === 'founder') return '#FFD700';
        if (d.data.is_maternal) return '#9B8070';
        if (d.data.claimed) return '#4CAF50';
        return '#5C4033';
      })
      .attr('stroke-dasharray', (d) => d.data.is_maternal ? '3,2' : null)
      .attr('stroke-width', (d) => (d.data.badge === 'founder' ? 3.5 : 2))
      .attr('filter', (d) => {
        if (d.data.badge === 'founder') return 'url(#founderGlow)';
        if (d.data.badge) return 'url(#glow)';
        return 'url(#nodeShadow)';
      });

    // Person photo thumbnails (non-founder — founder has its own below)
    nodes
      .filter((d) => d.data.photo_url && d.data.badge !== 'founder')
      .append('image')
      .attr('href', (d) => d.data.photo_url)
      .attr('x', (d) => -(d.data.badge ? 19 : 15))
      .attr('y', (d) => -(d.data.badge ? 19 : 15))
      .attr('width', (d) => (d.data.badge ? 38 : 30))
      .attr('height', (d) => (d.data.badge ? 38 : 30))
      .attr('clip-path', (d) => `url(#photo-clip-${d.data.id})`)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('pointer-events', 'none');

    // Founder portrait image
    nodes
      .filter((d) => d.data.badge === 'founder')
      .append('image')
      .attr('href', mirmetinImg)
      .attr('x', -28)
      .attr('y', -28)
      .attr('width', 56)
      .attr('height', 56)
      .attr('clip-path', 'url(#founderClip)')
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('pointer-events', 'none');

    // Pending pulse ring (only the adder sees their own pending nodes via RLS)
    nodes
      .filter((d) => d.data.status === 'pending')
      .append('circle')
      .attr('class', 'pending-ring')
      .attr('r', (d) => (d.data.badge === 'founder' ? 38 : d.data.badge ? 28 : 24))
      .attr('fill', 'none')
      .attr('stroke', 'rgba(218,165,32,0.6)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3')
      .style('animation', 'breathe 2s ease-in-out infinite');

    // ⏳ badge for pending nodes
    nodes
      .filter((d) => d.data.status === 'pending')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (d) => (d.data.badge === 'founder' ? 0 : 18))
      .attr('y', (d) => (d.data.badge === 'founder' ? -50 : -24))
      .attr('font-size', '11px')
      .attr('pointer-events', 'none')
      .text('⏳');

    // Inner icon (gender) — hidden for founder since portrait covers it
    nodes
      .filter((d) => d.data.badge !== 'founder')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '14px')
      .attr('pointer-events', 'none')
      .text((d) => (d.data.gender === 'F' ? '♀' : '♂'))
      .attr('fill', 'rgba(255,255,255,0.7)');

    // Badge above (pointer-events enabled for tooltip)
    nodes
      .filter((d) => d.data.badge)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => (d.data.badge === 'founder' ? -42 : -30))
      .attr('font-size', (d) => (d.data.badge === 'founder' ? '22px' : '16px'))
      .attr('pointer-events', 'all')
      .style('cursor', 'help')
      .text((d) => BADGE_MAP[d.data.badge]?.icon || '')
      .on('mouseenter', function (event, d) {
        const b = BADGE_MAP[d.data.badge];
        if (!b?.description) return;
        tooltip
          .html(
            `<div style="font-size:9.5px;color:#A89070;font-family:'DM Mono',monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">${b.icon} ${b.label}</div>` +
            `<div style="font-size:12px;color:#D4C4A8;line-height:1.55;font-family:'Lato',sans-serif">${b.description}</div>`
          )
          .style('opacity', '1')
          .style('left', `${event.clientX + 16}px`)
          .style('top', `${event.clientY - 20}px`);
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', `${event.clientX + 16}px`)
          .style('top', `${event.clientY - 20}px`);
      })
      .on('mouseleave', () => tooltip.style('opacity', '0'));

    // Eagle for founder
    nodes
      .filter((d) => d.data.badge === 'founder')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', 42)
      .attr('y', 6)
      .attr('font-size', '28px')
      .attr('pointer-events', 'none')
      .text('🦅');

    // Name label
    nodes
      .append('text')
      .attr('class', 'node-name')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => (d.data.badge === 'founder' ? 50 : 34))
      .attr('font-size', (d) => (d.data.badge === 'founder' ? '12.5px' : '10px'))
      .attr('font-weight', (d) => (d.data.badge ? '600' : '400'))
      .attr('fill', '#E8DCC8')
      .attr('font-family', "'Cormorant Garamond', Georgia, serif")
      .attr('pointer-events', 'none')
      .text((d) => {
        const n = d.data.name;
        return n.length > 22 ? n.slice(0, 20) + '…' : n;
      });

    // Years label
    nodes
      .append('text')
      .attr('class', 'node-years')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => (d.data.badge === 'founder' ? 64 : 46))
      .attr('font-size', '8.5px')
      .attr('fill', '#A89070')
      .attr('font-family', "'DM Mono', monospace")
      .attr('pointer-events', 'none')
      .text((d) => {
        const b = d.data.birth;
        const dd = d.data.death;
        return dd ? `${b}–${dd}` : `b. ${b}`;
      });

    // Clan label for offshoots
    nodes
      .filter((d) => d.data.clan && d.data.clan !== 'Kapmirmet')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => (d.data.badge === 'founder' ? 78 : 58))
      .attr('font-size', '7.5px')
      .attr('fill', '#9ACD32')
      .attr('font-family', "'DM Mono', monospace")
      .attr('letter-spacing', '1px')
      .attr('pointer-events', 'none')
      .text((d) => d.data.clan.toUpperCase());

    // ── Mother / wife satellite nodes (toggled per-node via caret) ──
    if (mothersMap && mothersMap.size > 0) {
      const motherEntries = [];
      hierarchy.descendants().forEach((d) => {
        const mothers = mothersMap.get(d.data.id);
        if (!mothers) return;
        mothers.forEach((motherData, _mid, _map, idx = motherEntries.length) => {
          motherEntries.push({ node: d, mother: motherData, idx });
        });
      });

      const motherGroups = g.selectAll('.mother-node')
        .data(motherEntries)
        .enter()
        .append('g')
        .attr('class', (d) => `mother-node mother-of-${d.node.data.id}`)
        .attr('transform', (d) => `translate(${d.node.x + 52 + d.idx * 36},${d.node.y})`)
        .style('opacity', (d) => expandedWives.current.has(d.node.data.id) ? 1 : 0)
        .style('pointer-events', (d) => expandedWives.current.has(d.node.data.id) ? 'all' : 'none')
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          onSelectPerson(d.mother);
        });

      // Dashed connecting line to father node
      motherGroups.append('line')
        .attr('x1', -52).attr('y1', 0)
        .attr('x2', -13).attr('y2', 0)
        .attr('stroke', '#A89070')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('pointer-events', 'none');

      // Hover ring
      motherGroups.append('circle')
        .attr('class', 'mother-hover-ring')
        .attr('r', 15)
        .attr('fill', 'none')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 2);

      // Main circle
      motherGroups.append('circle')
        .attr('r', 12)
        .attr('fill', 'url(#femGrad-Kapmirmet)')
        .attr('stroke', '#C9917B')
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#nodeShadow)');

      // Gender icon
      motherGroups.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '10px')
        .attr('fill', 'rgba(255,255,255,0.75)')
        .attr('pointer-events', 'none')
        .text('♀');

      // Name label
      motherGroups.append('text')
        .attr('class', 'mother-label')
        .attr('text-anchor', 'middle')
        .attr('y', 24)
        .attr('font-size', '8.5px')
        .attr('fill', '#C9917B')
        .attr('font-family', "'Cormorant Garamond', Georgia, serif")
        .attr('pointer-events', 'none')
        .text((d) => {
          const n = d.mother.name;
          return n.length > 16 ? n.slice(0, 14) + '…' : n;
        });

      // Hover interactions
      motherGroups
        .on('mouseenter', function () {
          d3.select(this).select('.mother-hover-ring')
            .transition().duration(200)
            .attr('stroke', '#C9917B').attr('stroke-opacity', 0.5);
        })
        .on('mouseleave', function () {
          d3.select(this).select('.mother-hover-ring')
            .transition().duration(300)
            .attr('stroke', 'transparent');
        });

      // ── Wife caret toggle buttons ──
      nodes
        .filter((d) => mothersMap.has(d.data.id))
        .each(function(d) {
          const nodeGroup = d3.select(this);
          const isFounder = d.data.badge === 'founder';
          const yOffset = isFounder ? 86 : 64;
          const id = d.data.id;
          const isExpanded = expandedWives.current.has(id);

          const caret = nodeGroup.append('g')
            .attr('class', 'wife-caret')
            .attr('transform', `translate(0, ${yOffset})`)
            .style('cursor', 'pointer');

          caret.append('rect')
            .attr('x', -18)
            .attr('y', -7)
            .attr('width', 36)
            .attr('height', 14)
            .attr('rx', 7)
            .attr('fill', isExpanded ? 'rgba(201,145,123,0.25)' : 'rgba(201,145,123,0.08)')
            .attr('stroke', '#C9917B')
            .attr('stroke-width', 0.75);

          caret.append('text')
            .attr('class', 'wife-caret-text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '8px')
            .attr('fill', '#D4A892')
            .attr('pointer-events', 'none')
            .attr('font-family', "'DM Mono', monospace")
            .text(isExpanded ? '♀ ‹' : '♀ ›');

          caret.on('click', function(event) {
            event.stopPropagation();
            const wasExpanded = expandedWives.current.has(id);
            if (wasExpanded) {
              expandedWives.current.delete(id);
            } else {
              expandedWives.current.add(id);
            }
            const nowExpanded = !wasExpanded;

            caret.select('rect')
              .attr('fill', nowExpanded ? 'rgba(201,145,123,0.25)' : 'rgba(201,145,123,0.08)');
            caret.select('.wife-caret-text')
              .text(nowExpanded ? '♀ ‹' : '♀ ›');

            d3.select(svgRef.current).selectAll(`.mother-of-${id}`)
              .transition()
              .duration(250)
              .style('opacity', nowExpanded ? 1 : 0)
              .style('pointer-events', nowExpanded ? 'all' : 'none');
          });
        });
    }

    // ── Plus buttons (shown on branch hover) ──
    const plusGroups = g.selectAll('.branch-plus')
      .data(hierarchy.links())
      .enter()
      .append('g')
      .attr('class', 'branch-plus')
      .attr('transform', (d) => `translate(${(d.source.x + d.target.x) / 2},${(d.source.y + d.target.y) / 2})`)
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('cursor', 'pointer')
      .each(function (d) {
        plusMap.set(d.source.data.id + '-' + d.target.data.id, this);
      });

    plusGroups.append('circle')
      .attr('r', 11)
      .attr('fill', '#1A120B')
      .attr('stroke', '#8B6914')
      .attr('stroke-width', 1.5);

    plusGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '16px')
      .attr('fill', '#DAA520')
      .attr('pointer-events', 'none')
      .text('+');

    plusGroups
      .on('mouseenter', function () {
        clearTimeout(branchHoverTimer);
      })
      .on('mouseleave', function () {
        const el = this;
        branchHoverTimer = setTimeout(() => {
          d3.select(el).style('opacity', 0).style('pointer-events', 'none');
        }, 150);
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        onAddPerson(d.source.data);
      });

    // ── SEEDLINGS (floating) ──
    const seedGroup = g.append('g').attr('class', 'seedlings');

    // Position seedlings to the right side
    const maxX = d3.max(hierarchy.descendants(), (d) => d.x) || 400;
    const seedStartX = maxX + 180;
    const seedStartY = -40;

    seedlings.forEach((s, i) => {
      const sx = seedStartX + (i % 2) * 70;
      const sy = seedStartY + i * 110;

      const sg = seedGroup
        .append('g')
        .attr('transform', `translate(${sx},${sy})`)
        .style('cursor', 'pointer')
        .style('opacity', 0)
        .on('click', () => onSelectPerson(s));

      sg.transition()
        .duration(500)
        .delay(1800 + i * 200)
        .style('opacity', 1);

      // Dotted line suggesting connection
      sg.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', -50).attr('y2', -30)
        .attr('stroke', '#5C4033')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,6')
        .attr('opacity', 0.4);

      // Pulsing ring
      sg.append('circle')
        .attr('r', 18)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(218,165,32,0.2)')
        .attr('stroke-width', 1)
        .style('animation', 'breathe 3s ease-in-out infinite')
        .style('animation-delay', `${i * 0.5}s`);

      // Node
      sg.append('circle')
        .attr('r', 14)
        .attr('fill', s.gender === 'F' ? '#C9917B' : '#B8A080')
        .attr('stroke', '#5C4033')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,3')
        .attr('filter', 'url(#nodeShadow)');

      // Seed icon
      sg.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -22)
        .attr('font-size', '16px')
        .attr('pointer-events', 'none')
        .text('🌱');

      // Name
      sg.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 30)
        .attr('font-size', '9px')
        .attr('fill', '#A89070')
        .attr('font-family', "'Cormorant Garamond', serif")
        .attr('pointer-events', 'none')
        .text(s.name);

      // Birth
      sg.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 42)
        .attr('font-size', '7.5px')
        .attr('fill', '#7B6845')
        .attr('font-family', "'DM Mono', monospace")
        .attr('pointer-events', 'none')
        .text(`b. ${s.birth}`);

      // "Unattached" label
      sg.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 54)
        .attr('font-size', '7px')
        .attr('fill', '#5C4033')
        .attr('font-family', "'DM Mono', monospace")
        .attr('letter-spacing', '1px')
        .attr('pointer-events', 'none')
        .text('SEEDLING');
    });

    return () => tooltip.remove();
  }, [svgRef, hierarchy, seedlings, mothersMap, onSelectPerson, onAddPerson]);

  return null; // Rendering is via D3 imperative code
}
