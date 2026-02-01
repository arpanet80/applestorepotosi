// category-tree.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface TreeNode {
  id: string | number;
  name: string;
  slug: string;
  isActive: boolean;
  parentId?: string | number | null;
  children?: TreeNode[];
  expanded?: boolean; // Estado de expansión
}

@Component({
  selector: 'app-category-tree',
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css']
})
export class CategoryTreeComponent {
  @Input() nodes: TreeNode[] = [];
  @Input() showActions: boolean = true;
  
  @Output() nodeEdit = new EventEmitter<TreeNode>();
  @Output() nodeDelete = new EventEmitter<TreeNode>();
  @Output() nodeAddChild = new EventEmitter<TreeNode>();

  /**
   * Toggle para expandir/colapsar un nodo
   */
  toggleNode(node: TreeNode): void {
    node.expanded = !node.expanded;
  }

  /**
   * Emitir evento de edición
   */
  onEdit(node: TreeNode): void {
    this.nodeEdit.emit(node);
  }

  /**
   * Emitir evento de eliminación
   */
  onDelete(node: TreeNode): void {
    this.nodeDelete.emit(node);
  }

  /**
   * Emitir evento de agregar hijo
   */
  onAddChild(node: TreeNode): void {
    this.nodeAddChild.emit(node);
  }

  /**
   * Expandir todos los nodos recursivamente
   */
  expandAll(nodes: TreeNode[] = this.nodes): void {
    nodes.forEach(node => {
      node.expanded = true;
      if (node.children && node.children.length > 0) {
        this.expandAll(node.children);
      }
    });
  }

  /**
   * Colapsar todos los nodos recursivamente
   */
  collapseAll(nodes: TreeNode[] = this.nodes): void {
    nodes.forEach(node => {
      node.expanded = false;
      if (node.children && node.children.length > 0) {
        this.collapseAll(node.children);
      }
    });
  }
}