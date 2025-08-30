'use client';

import { useState } from 'react';
import { ContentBlock, ListType, ListItem, RichText } from '@/lib/types';
import BasicTextInput from '@/components/BasicTextInput';

interface ListBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export default function ListBlock({
  block,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
}: ListBlockProps) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const listType = block.content.listType || 'bullet';
  const listItems = block.content.listItems || [];

  const handleTypeChange = (type: ListType) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        listType: type
      }
    });
    setShowTypeMenu(false);
  };

  const handleItemChange = (itemIndex: number, newContent: RichText) => {
    const updatedItems = [...listItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      content: newContent
    };
    
    onUpdate({
      ...block,
      content: {
        ...block.content,
        listItems: updatedItems
      }
    });
  };

  const handleItemCheck = (itemIndex: number, checked: boolean) => {
    const updatedItems = [...listItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      checked
    };
    
    onUpdate({
      ...block,
      content: {
        ...block.content,
        listItems: updatedItems
      }
    });
  };

  const addNewItem = () => {
    const newItem: ListItem = {
      id: crypto.randomUUID(),
      content: { spans: [{ text: '' }] },
      checked: false
    };
    
    onUpdate({
      ...block,
      content: {
        ...block.content,
        listItems: [...listItems, newItem]
      }
    });
  };

  const removeItem = (itemIndex: number) => {
    if (listItems.length <= 1) {
      onDelete();
      return;
    }
    
    const updatedItems = listItems.filter((_, index) => index !== itemIndex);
    onUpdate({
      ...block,
      content: {
        ...block.content,
        listItems: updatedItems
      }
    });
  };

  const getTypeLabel = (type: ListType) => {
    switch (type) {
      case 'bullet': return 'Bullet List';
      case 'numbered': return 'Numbered List';
      case 'checklist': return 'Checklist';
      default: return 'Bullet List';
    }
  };

  const renderListMarker = (type: ListType, index: number, item: ListItem) => {
    switch (type) {
      case 'bullet':
        return <span className="text-slate-500 dark:text-slate-400 mr-2">•</span>;
      case 'numbered':
        return <span className="text-slate-500 dark:text-slate-400 mr-2 min-w-[20px]">{index + 1}.</span>;
      case 'checklist':
        return (
          <button
            onClick={() => handleItemCheck(index, !item.checked)}
            className="mr-2 mt-1 flex-shrink-0"
          >
            <div className={`w-4 h-4 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center ${
              item.checked ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-slate-700'
            }`}>
              {item.checked && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        );
      default:
        return <span className="text-slate-500 dark:text-slate-400 mr-2">•</span>;
    }
  };

  return (
    <div 
      className={`group relative py-2 ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >

      {/* List type selector and delete */}
      <div className="absolute -right-24 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded transition-colors"
          >
            {getTypeLabel(listType)}
          </button>
          
          {showTypeMenu && (
            <div className="absolute top-8 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-10">
              {(['bullet', 'numbered', 'checklist'] as ListType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                    listType === type ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          )}
        </div>

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

      {/* List items */}
      <div className="space-y-1">
        {listItems.map((item, index) => (
          <div key={item.id} className="flex items-start group/item">
            {renderListMarker(listType, index, item)}
            
            <div className="flex-1">
              <BasicTextInput
                content={item.content}
                onChange={(newContent) => handleItemChange(index, newContent)}
                placeholder="List item..."
                className={`text-slate-700 dark:text-slate-200 ${item.checked ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}
                tag="div"
              />
            </div>
            
            {/* Remove item button */}
            {listItems.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="ml-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group/item-hover:opacity-100 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new item button */}
      <button
        onClick={addNewItem}
        className="mt-2 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add item
      </button>

      {/* Click backdrop to close type menu */}
      {showTypeMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowTypeMenu(false)}
        />
      )}
    </div>
  );
}