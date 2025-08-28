'use client';

import { ContentBlock, ListItem, RichText } from '@/lib/content';
import SimpleRichTextEditor from '@/components/SimpleRichTextEditor';

interface CollapsibleListBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export default function CollapsibleListBlock({
  block,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
}: CollapsibleListBlockProps) {
  const title = block.content.title || { spans: [{ text: 'Collapsible Section' }] };
  const isExpanded = block.content.isExpanded ?? false;
  const items = block.content.items || [];

  const handleTitleChange = (newTitle: RichText) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        title: newTitle
      }
    });
  };

  const toggleExpanded = () => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        isExpanded: !isExpanded
      }
    });
  };

  const handleItemChange = (itemIndex: number, newContent: RichText) => {
    const updatedItems = [...items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      content: newContent
    };
    
    onUpdate({
      ...block,
      content: {
        ...block.content,
        items: updatedItems
      }
    });
  };

  const addNewItem = () => {
    const newItem: ListItem = {
      id: crypto.randomUUID(),
      content: { spans: [{ text: '' }] }
    };
    
    onUpdate({
      ...block,
      content: {
        ...block.content,
        items: [...items, newItem]
      }
    });
  };

  const removeItem = (itemIndex: number) => {
    if (items.length <= 1) {
      const newItems: ListItem[] = [{
        id: crypto.randomUUID(),
        content: { spans: [{ text: '' }] }
      }];
      
      onUpdate({
        ...block,
        content: {
          ...block.content,
          items: newItems
        }
      });
      return;
    }
    
    const updatedItems = items.filter((_, index) => index !== itemIndex);
    onUpdate({
      ...block,
      content: {
        ...block.content,
        items: updatedItems
      }
    });
  };

  return (
    <div 
      className={`group relative py-2 ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div 
        className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
        onMouseDown={onDragStart}
      >
        <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </div>

      {/* Delete button */}
      <div className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          title="Delete block"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Collapsible header */}
      <div className="flex items-center space-x-2 mb-2">
        <button
          onClick={toggleExpanded}
          className="flex-shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <svg 
            className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="flex-1">
          <SimpleRichTextEditor
            content={title}
            onChange={handleTitleChange}
            placeholder="Section title..."
            className="font-medium text-slate-800 dark:text-slate-200"
            tag="div"
          />
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-start group/item">
                <span className="text-slate-500 dark:text-slate-400 mr-2 mt-1">•</span>
                
                <div className="flex-1">
                  <SimpleRichTextEditor
                    content={item.content}
                    onChange={(newContent) => handleItemChange(index, newContent)}
                    placeholder="Item content..."
                    className="text-slate-700 dark:text-slate-200"
                    tag="div"
                  />
                </div>
                
                {/* Remove item button */}
                <button
                  onClick={() => removeItem(index)}
                  className="ml-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group/item-hover:opacity-100 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add new item button */}
          <button
            onClick={addNewItem}
            className="mt-3 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add item
          </button>
        </div>
      )}
    </div>
  );
}