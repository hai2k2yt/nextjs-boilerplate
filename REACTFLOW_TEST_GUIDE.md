# React Flow Test Guide

## ✅ Step-by-Step Testing Instructions

### 1. **Basic Page Load Test**
- Navigate to `/reactflow`
- ✅ Page should load without errors
- ✅ You should see: Sidebar (left), Canvas (center), Properties Panel (right)
- ✅ Toolbar should be visible at top-left of canvas

### 2. **Drag & Drop Test**
- From the sidebar, drag any node type to the canvas
- ✅ Node should appear where you drop it
- ✅ Node should be automatically selected (blue border)
- ✅ Properties panel should show node details

### 3. **Node Selection Test**
- Click on any existing node
- ✅ Node should get blue border when selected
- ✅ Properties panel should update to show selected node
- ✅ Try clicking different nodes to test selection switching

### 4. **Label Editing Test**
- Select a node
- Go to Properties Panel → General tab
- Change the "Label" field
- ✅ Label should update in real-time on the node
- ✅ Type different text and verify it appears on the node

### 5. **Description Editing Test**
- Select a node (preferably a custom input/process/output node)
- Go to Properties Panel → General tab
- Change the "Description" field
- ✅ Description should update on the node (visible in smaller text)

### 6. **Position Editing Test**
- Select a node
- Go to Properties Panel → General tab
- Change X or Y position values
- ✅ Node should move to new position immediately
- ✅ Try dragging the node and verify X/Y values update in properties

### 7. **Style Editing Test**
- Select a node
- Go to Properties Panel → Style tab
- Click different background colors
- ✅ Node background should change color
- Change width/height values
- ✅ Node size should change

### 8. **Node Connection Test**
- Drag from an output handle (right side) of one node
- Drop on an input handle (left side) of another node
- ✅ Edge should be created connecting the nodes
- ✅ Select the edge and verify properties panel shows edge details

### 9. **Keyboard Shortcuts Test**
- Select a node and press Ctrl+D
- ✅ Node should be duplicated
- Select a node and press Delete
- ✅ Node should be deleted
- Press Ctrl+Z
- ✅ Last action should be undone

### 10. **Multi-Selection Test**
- Hold Ctrl and click multiple nodes
- ✅ Multiple nodes should be selected
- ✅ Properties panel should show "Multiple elements selected"

### 11. **Toolbar Functions Test**
- Click zoom in/out buttons
- ✅ Canvas should zoom
- Click fit view button
- ✅ All nodes should be visible
- Toggle snap to grid
- ✅ Dragged nodes should snap to grid when enabled

### 12. **Export/Import Test**
- Click export button in toolbar
- ✅ JSON file should download
- Create some nodes and connections
- Click import button and select the downloaded file
- ✅ Flow should be restored to exported state

## 🐛 Common Issues & Solutions

### Issue: "Cannot edit description"
**Solution**: 
1. Make sure you're selecting a custom node (not default input/output)
2. Check that the node has a description field in its data
3. Verify the properties panel is showing the correct node

### Issue: "X + Y not updating when dragging"
**Solution**:
1. The position should update in real-time as you drag
2. If not working, try refreshing the page
3. Check browser console for errors

### Issue: "Label cannot edit"
**Solution**:
1. Make sure the node is selected (blue border)
2. Properties panel should be open on the right
3. Try typing in the label field in the General tab
4. Check browser console for errors

### Issue: "Drag and drop not working"
**Solution**:
1. Make sure you're dragging from the colored node boxes in sidebar
2. Drop onto the canvas area (not on existing nodes)
3. Check browser console for errors

## 🔧 Debugging Tips

1. **Open Browser Console** (F12) to see any error messages
2. **Check Network Tab** to ensure all resources are loading
3. **Try Hard Refresh** (Ctrl+F5) to clear cache
4. **Test in Different Browser** to rule out browser-specific issues

## 📋 Expected Behavior Summary

- ✅ Drag & drop creates new nodes
- ✅ Nodes are selectable and draggable
- ✅ Properties panel allows editing all node properties
- ✅ Position updates in real-time when dragging
- ✅ Label and description changes reflect immediately
- ✅ Style changes (color, size) apply instantly
- ✅ Keyboard shortcuts work (Ctrl+D, Delete, Ctrl+Z)
- ✅ Connections can be made between nodes
- ✅ Export/import preserves all data
- ✅ All toolbar functions work properly

## 🆘 If Tests Fail

1. Check that you're on the correct page: `/reactflow`
2. Ensure the development server is running: `npm run dev`
3. Verify all dependencies are installed: `npm install`
4. Check for TypeScript/compilation errors in terminal
5. Try restarting the development server

If issues persist, check the browser console for specific error messages and refer to the troubleshooting guide.
