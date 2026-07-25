import React from 'react'
import { Drawer } from '@/components/ui/overlays'
import { ContentLibrary } from './ContentLibrary'

interface AssetPickerDrawerProps {
  open: boolean
  onClose: () => void
  typeFilter: 'video' | 'document' | 'image' | 'audio' | 'archive' | 'other' | 'all'
  onSelect: (mediaItem: any) => void
}

export function AssetPickerDrawer({
  open,
  onClose,
  typeFilter,
  onSelect
}: AssetPickerDrawerProps) {
  return (
    <Drawer 
      open={open} 
      onClose={onClose} 
      title={`Select ${typeFilter === 'video' ? 'Video' : 'Material'} from Library`}
      width="850px"
    >
      <div className="p-4 h-full bg-[rgb(var(--bg-base))]">
        <ContentLibrary 
          defaultTypeFilter={typeFilter} 
          isPickerMode={true} 
          onSelect={(item) => {
            onSelect(item)
            onClose()
          }}
        />
      </div>
    </Drawer>
  )
}
