// All type definitions for the unified database

export interface Project {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  createdAt: Date;
}

export interface Composable {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  color: string;
  position: { x: number; y: number };
  createdAt: Date;
}

export interface ProjectSettings {
  id: string;
  projectId: string;
  statusTypes: string[];
  commentatorTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type BlockType = 
  | 'header' 
  | 'text' 
  | 'list' 
  | 'divider' 
  | 'collapsible-list' 
  | 'text-block'
  | 'markdown';

export type ListType = 'bullet' | 'numbered' | 'checklist';
export type HeaderSize = 'h1' | 'h2' | 'h3';
export type DividerStyle = 'solid' | 'dashed' | 'dotted' | 'double';

export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  link?: string; // URL for links
  commentId?: string; // ID of associated comment
}

export interface RichTextSpan {
  text: string;
  style?: TextStyle;
}

export interface RichText {
  spans: RichTextSpan[];
}

export interface ListItem {
  id: string;
  content: RichText;
  checked?: boolean;
  children?: ListItem[];
}

export interface ContentBlock {
  id: string;
  composableId: string;
  type: BlockType;
  position: number;
  parentBlockId?: string; // For nested blocks
  content: {
    // Header block
    headerSize?: HeaderSize;
    headerText?: RichText;
    
    // Text block
    text?: RichText;
    
    // List block
    listType?: ListType;
    listItems?: ListItem[];
    
    // Divider block
    dividerStyle?: DividerStyle;
    
    // Collapsible list block (toggle section)
    title?: RichText;
    isExpanded?: boolean;
    nestedBlocks?: ContentBlock[]; // Changed from items to nested blocks
    
    // Text block (longer content)
    textContent?: RichText;
    
    // Markdown block
    markdownContent?: string;
    
    // Styling
    backgroundColor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  blockId: string;
  composableId: string;
  authorType: string;
  authorName: string;
  content: string;
  position?: { start: number; end: number };
  resolved: boolean;
  color?: string;
  showIndicator?: boolean;
  createdAt: Date;
  updatedAt: Date;
}