import { useRef, useState, useCallback, useEffect, forwardRef } from 'react';
import { Stage, Layer, Line, Rect, Circle, Arrow, Transformer, Text } from 'react-konva';
import styled from '@emotion/styled';
import { FaPencilAlt, FaMinus, FaArrowRight, FaSquare, FaCircle, FaEraser, FaPalette, FaTrash, FaUndo, FaRedo, FaArrowsAlt, FaSearchPlus, FaSearchMinus, FaFont } from 'react-icons/fa';

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 1.1rem;
  background: rgba(34, 40, 49, 0.95);
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid #222;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.2);
  border-radius: 14px 14px 0 0;
`;

const ToolButton = styled.button`
  background: none;
  border: none;
  color: #61dafb;
  font-size: 1.35rem;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border-radius: 7px;
  position: relative;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover, &.active {
    background: linear-gradient(90deg, #232526 60%, rgba(0, 122, 204, 0.2));
    color: #fff;
    box-shadow: 0 2px 8px rgba(97, 218, 251, 0.3);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ColorInput = styled.input`
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  margin-left: 0.5rem;
  background: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.2);
`;

const BrushSizeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
`;

const BrushSizeLabel = styled.span`
  color: #61dafb;
  font-size: 0.9rem;
`;

const BrushSizeInput = styled.input`
  width: 60px;
  height: 30px;
  border: none;
  border-radius: 7px;
  background: rgba(97, 218, 251, 0.1);
  color: #61dafb;
  padding: 0 0.5rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.2);
  &:focus {
    outline: none;
    box-shadow: 0 2px 12px rgba(97, 218, 251, 0.4);
  }
`;

const WhiteboardContainer = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(34, 40, 49, 0.95);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 16px rgba(0, 122, 204, 0.2);
  transition: box-shadow 0.3s, background 0.3s;
`;

const StageContainer = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
`;

const tools = [
  { name: 'move', icon: <FaArrowsAlt />, label: 'Move' },
  { name: 'pencil', icon: <FaPencilAlt />, label: 'Pencil' },
  { name: 'line', icon: <FaMinus />, label: 'Line' },
  { name: 'arrow', icon: <FaArrowRight />, label: 'Arrow' },
  { name: 'rect', icon: <FaSquare />, label: 'Rectangle' },
  { name: 'circle', icon: <FaCircle />, label: 'Circle' },
  { name: 'text', icon: <FaFont />, label: 'Text' },
  { name: 'eraser', icon: <FaEraser />, label: 'Eraser' },
  { name: 'delete', icon: <FaTrash />, label: 'Clear' },
];

const getCursor = (tool) => {
  switch (tool) {
    case 'pencil':
    case 'line':
    case 'arrow':
    case 'rect':
    case 'circle':
      return 'crosshair';
    case 'eraser':
      return 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'8\'/></svg>") 12 12, auto';
    default:
      return 'default';
  }
};

const KonvaWhiteboard = forwardRef(({ width = '100%', height = '100%' }, ref) => {
  const [tool, setTool] = useState('move');
  const [color, setColor] = useState('#007acc');
  const [brushSize, setBrushSize] = useState(4);
  const [lines, setLines] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [textNodes, setTextNodes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [scale, setScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const textareaRef = useRef(null);
  const stageRef = useRef();
  const transformerRef = useRef();
  const containerRef = useRef();
  const textNodeRefs = useRef({});

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle keyboard events for Ctrl key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update zoom functionality
  useEffect(() => {
    const handleZoom = (e) => {
      if (!e.ctrlKey || !['=', '+', '-'].includes(e.key)) return;
      e.preventDefault();
      
      const stage = stageRef.current;
      const scaleBy = 1.1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      
      const newScale = e.key === '-' ? oldScale / scaleBy : oldScale * scaleBy;
      setScale(newScale);
      
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      
      setStagePosition(newPos);
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (!e.ctrlKey) return;

      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      
      const scaleBy = 1.1;
      const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      setScale(newScale);
      
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      
      setStagePosition(newPos);
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    };

    window.addEventListener('keydown', handleZoom);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleZoom);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const saveToHistory = useCallback((newLines, newTextNodes) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ lines: newLines, textNodes: newTextNodes });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setLines(state.lines);
      setTextNodes(state.textNodes);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setLines(state.lines);
      setTextNodes(state.textNodes);
    }
  }, [history, historyIndex]);

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const selectedNode = textNodeRefs.current[selectedId];
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else {
      transformerRef.current?.nodes([]);
      transformerRef.current?.getLayer().batchDraw();
    }
  }, [selectedId, textNodes]);

  // Add text editing functionality
  useEffect(() => {
    if (isTextEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isTextEditing]);

  const handleBrushSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    if (!isNaN(newSize) && newSize > 0 && newSize <= 50) {
      setBrushSize(newSize);
    }
  };

  const startTextEditing = (textNode) => {
    const stage = stageRef.current;
    const stageBox = stage.container().getBoundingClientRect();
    
    // Calculate the absolute position considering scale and stage position
    const areaPosition = {
      x: stageBox.left + (textNode.x * scale) + stagePosition.x,
      y: stageBox.top + (textNode.y * scale) + stagePosition.y,
    };

    const textNodeId = textNode.id;
    setEditingTextId(textNodeId);
    setIsTextEditing(true);

    // Safely remove existing textarea
    if (textareaRef.current && document.body.contains(textareaRef.current)) {
      document.body.removeChild(textareaRef.current);
    }

    const textarea = document.createElement('textarea');
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${(textNode.width - textNode.padding * 2) * scale}px`;
    textarea.style.height = `${(textNode.height - textNode.padding * 2) * scale}px`;
    textarea.style.fontSize = `${textNode.fontSize * scale}px`;
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textNode.lineHeight;
    textarea.style.fontFamily = textNode.fontFamily;
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align;
    textarea.style.color = textNode.fill;
    textarea.style.zIndex = '9999';
    textarea.style.pointerEvents = 'auto';
    textarea.style.background = 'rgba(255, 255, 255, 0.1)';
    textarea.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
    textarea.spellcheck = false;
    textarea.autocomplete = 'off';

    textarea.value = textNode.text;
    document.body.appendChild(textarea);
    textareaRef.current = textarea;

    // Focus with delay and select text
    setTimeout(() => {
      if (textarea && document.body.contains(textarea)) {
        textarea.focus();
        textarea.select();
      }
    }, 50);

    const updateText = () => {
      setTextNodes(prev => prev.map(node => {
        if (node.id === textNodeId) {
          return { 
            ...node, 
            text: textarea.value,
            width: Math.max(200, textarea.value.length * (textNode.fontSize / 2))
          };
        }
        return node;
      }));
    };

    const cleanup = () => {
      if (textarea && document.body.contains(textarea)) {
        updateText();
        document.body.removeChild(textarea);
      }
      setIsTextEditing(false);
      setEditingTextId(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        cleanup();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', updateText);
    textarea.addEventListener('blur', cleanup);

    // Prevent stage events while editing
    const preventStageEvents = (e) => {
      e.stopPropagation();
    };

    textarea.addEventListener('mousedown', preventStageEvents);
    textarea.addEventListener('mousemove', preventStageEvents);
    textarea.addEventListener('mouseup', preventStageEvents);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', updateText);
      textarea.removeEventListener('blur', cleanup);
      textarea.removeEventListener('mousedown', preventStageEvents);
      textarea.removeEventListener('mousemove', preventStageEvents);
      textarea.removeEventListener('mouseup', preventStageEvents);
    };
  };

  const createTextNode = (pos) => {
    const newTextNode = {
      x: pos.x,
      y: pos.y,
      text: '',
      fontSize: brushSize * 4,
      fontFamily: 'Arial',
      fill: color,
      width: 200,
      height: 50,
      id: `text-${Date.now()}`,
      draggable: true,
      padding: 5,
      align: 'left',
      lineHeight: 1.2
    };
    setTextNodes(prev => [...prev, newTextNode]);
    saveToHistory(lines, [...textNodes, newTextNode]);
    return newTextNode;
  };

  const handleTextDblClick = (e) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    const textNode = e.target;
    const node = textNodes.find(n => n.id === textNode.id());
    if (node) {
      startTextEditing(node);
    }
  };

  const handleDragEnd = (e) => {
    const id = e.target.id();
    const newTextNodes = textNodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          x: e.target.x(),
          y: e.target.y()
        };
      }
      return node;
    });
    setTextNodes(newTextNodes);
  };

  const handleMouseDown = (e) => {
    if (tool === 'delete') {
      setLines([]);
      setTextNodes([]);
      saveToHistory([], []);
      setSelectedId(null);
      return;
    }

    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }

    if (isCtrlPressed) {
      if (!clickedOnEmpty) {
        setSelectedId(e.target.id());
      }
      return;
    }

    const pos = e.target.getStage().getPointerPosition();

    if (tool === 'pencil' || tool === 'eraser') {
      setDrawing(true);
      setLines([...lines, { 
        points: [pos.x, pos.y], 
        color: tool === 'eraser' ? '#232831' : color,
        brushSize: tool === 'eraser' ? brushSize * 2 : brushSize,
        tool 
      }]);
    } else if (tool === 'line' || tool === 'arrow') {
      setDrawing(true);
      setLines([...lines, { points: [pos.x, pos.y, pos.x, pos.y], color, brushSize, tool }]);
    } else if (tool === 'rect') {
      setDrawing(true);
      setLines([...lines, { points: [pos.x, pos.y, 0, 0], color, brushSize, tool }]);
    } else if (tool === 'circle') {
      setDrawing(true);
      setLines([...lines, { points: [pos.x, pos.y, 0], color, brushSize, tool }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];

    if (tool === 'pencil' || tool === 'eraser') {
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      setLines([...lines.slice(0, -1), lastLine]);
    } else if (tool === 'line' || tool === 'arrow') {
      lastLine.points = [lastLine.points[0], lastLine.points[1], point.x, point.y];
      setLines([...lines.slice(0, -1), lastLine]);
    } else if (tool === 'rect') {
      const startX = lastLine.points[0];
      const startY = lastLine.points[1];
      lastLine.points = [startX, startY, point.x - startX, point.y - startY];
      setLines([...lines.slice(0, -1), lastLine]);
    } else if (tool === 'circle') {
      const startX = lastLine.points[0];
      const startY = lastLine.points[1];
      const radius = Math.sqrt(Math.pow(point.x - startX, 2) + Math.pow(point.y - startY, 2));
      lastLine.points = [startX, startY, radius];
      setLines([...lines.slice(0, -1), lastLine]);
    }
  };

  const handleMouseUp = () => {
    setDrawing(false);
    if (drawing) {
      const newLines = lines.slice();
      saveToHistory(newLines, textNodes);
    }
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // Add cleanup for text editing on unmount
  useEffect(() => {
    return () => {
      if (textareaRef.current && document.body.contains(textareaRef.current)) {
        document.body.removeChild(textareaRef.current);
      }
    };
  }, []);

  const handleStageDblClick = (e) => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    // Only create if double-clicked on empty space (not on a text node)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      const newTextNode = createTextNode(pointer);
      setTimeout(() => {
        startTextEditing(newTextNode);
      }, 0);
    }
  };

  const handleTextTransform = (e) => {
    const node = e.target;
    const id = node.id();
    const width = node.width() * node.scaleX();
    const height = node.height() * node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    setTextNodes(prev => prev.map(n => n.id === id ? { ...n, width, height } : n));
  };

  return (
    <WhiteboardContainer ref={ref}>
      <Toolbar>
        {tools.map((t) => (
          <ToolButton
            key={t.name}
            className={tool === t.name ? 'active' : ''}
            onClick={() => setTool(t.name)}
            title={t.label}
          >
            {t.icon}
          </ToolButton>
        ))}
        <ColorInput
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title="Color"
        />
        <BrushSizeContainer>
          <BrushSizeLabel>Size:</BrushSizeLabel>
          <BrushSizeInput
            type="number"
            min="1"
            max="50"
            value={brushSize}
            onChange={handleBrushSizeChange}
            title="Brush Size"
          />
        </BrushSizeContainer>
        <ToolButton
          title="Undo"
          onClick={undo}
          disabled={historyIndex <= 0}
        >
          <FaUndo />
        </ToolButton>
        <ToolButton
          title="Redo"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        >
          <FaRedo />
        </ToolButton>
      </Toolbar>
      <StageContainer ref={containerRef}>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDblClick={handleStageDblClick}
          scale={{ x: scale, y: scale }}
          position={stagePosition}
          style={{ cursor: getCursor(tool) }}
        >
          <Layer>
            {lines.map((line, i) => {
              if (line.tool === 'rect') {
                return (
                  <Rect
                    key={i}
                    x={line.points[0]}
                    y={line.points[1]}
                    width={line.points[2]}
                    height={line.points[3]}
                    stroke={line.color}
                    strokeWidth={line.brushSize}
                    fill="transparent"
                  />
                );
              } else if (line.tool === 'circle') {
                return (
                  <Circle
                    key={i}
                    x={line.points[0]}
                    y={line.points[1]}
                    radius={line.points[2]}
                    stroke={line.color}
                    strokeWidth={line.brushSize}
                    fill="transparent"
                  />
                );
              } else if (line.tool === 'arrow') {
                const points = line.points;
                const dx = points[2] - points[0];
                const dy = points[3] - points[1];
                const angle = Math.atan2(dy, dx);
                const arrowLength = 20;
                const arrowPoints = [
                  points[2] - arrowLength * Math.cos(angle - Math.PI / 6),
                  points[3] - arrowLength * Math.sin(angle - Math.PI / 6),
                  points[2],
                  points[3],
                  points[2] - arrowLength * Math.cos(angle + Math.PI / 6),
                  points[3] - arrowLength * Math.sin(angle + Math.PI / 6),
                ];
                return (
                  <Arrow
                    key={i}
                    points={line.points}
                    stroke={line.color}
                    strokeWidth={line.brushSize}
                    fill={line.color}
                    pointerLength={20}
                    pointerWidth={20}
                  />
                );
              }
              return (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.brushSize}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    line.tool === 'eraser' ? 'destination-out' : 'source-over'
                  }
                />
              );
            })}
            {textNodes.map((node) => (
              editingTextId === node.id ? null : (
                <Text
                  key={node.id}
                  id={node.id}
                  ref={el => { if (el) textNodeRefs.current[node.id] = el; }}
                  {...node}
                  draggable
                  onClick={() => setSelectedId(node.id)}
                  onTap={() => setSelectedId(node.id)}
                  onDblClick={handleTextDblClick}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTextTransform}
                />
              )
            ))}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
              rotateEnabled={false}
              keepRatio={false}
              centeredScaling={false}
            />
          </Layer>
        </Stage>
      </StageContainer>
    </WhiteboardContainer>
  );
});

KonvaWhiteboard.displayName = 'KonvaWhiteboard';

export default KonvaWhiteboard; 