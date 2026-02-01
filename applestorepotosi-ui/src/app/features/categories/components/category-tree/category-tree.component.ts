// src/app/categories/components/category-tree/category-tree.component.ts
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../models/categories.model';

export interface TreeNode extends Category {
  children?: TreeNode[];
}

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTreeComponent {
  @Input() nodes: TreeNode[] = [];
  @Input() showActions = true;
  @Output() nodeToggle = new EventEmitter<TreeNode>();
  @Output() nodeEdit = new EventEmitter<TreeNode>();
  @Output() nodeDelete = new EventEmitter<TreeNode>();
  @Output() nodeAddChild = new EventEmitter<TreeNode>();
  @Input() depth = 0;

  expanded: Set<string> = new Set();

  toggle(node: TreeNode) {
    if (node.children?.length) {
      this.expanded.has(node._id)
        ? this.expanded.delete(node._id)
        : this.expanded.add(node._id);
      this.nodeToggle.emit(node);
    }
  }

  isExpanded(node: TreeNode): boolean {
    return this.expanded.has(node._id);
  }

  onEdit(node: TreeNode, $event: Event) {
    $event.stopPropagation();
    this.nodeEdit.emit(node);
  }

  onDelete(node: TreeNode, $event: Event) {
    $event.stopPropagation();
    this.nodeDelete.emit(node);
  }

  onAddChild(node: TreeNode, $event: Event) {
    $event.stopPropagation();
    this.nodeAddChild.emit(node);
  }

  trackByFn(_: number, node: TreeNode): string {
    return node._id;
  }
}