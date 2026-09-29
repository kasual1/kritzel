<template>
  <div class="demo-toolbar">
    <slot />
  </div>
</template>

<!-- Unscoped so slotted toolbar content (buttons, labels, separators) is styled too. -->
<style>
.demo-toolbar {
  display: flex;
  position: relative;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #ebebeb;
  flex-wrap: wrap;
}

.demo-toolbar > button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #ffffff;
  color: #333333;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.demo-toolbar > button:hover:not(:disabled) {
  background: #42b883;
  color: #ffffff;
  border-color: #42b883;
}

.demo-toolbar > button.active {
  background: #42b883;
  color: #ffffff;
  border-color: #42b883;
}

.demo-toolbar > button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.demo-toolbar > .label {
  font-size: 13px;
  font-weight: 500;
}

.demo-toolbar > .status {
  font-size: 12px;
  color: #555;
}

.demo-toolbar > .separator {
  width: 1px;
  height: 20px;
  background: #ddd;
}

.demo-toolbar > input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}
</style>
