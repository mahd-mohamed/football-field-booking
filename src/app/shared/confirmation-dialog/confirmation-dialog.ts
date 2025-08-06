import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="modal-backdrop-custom" (click)="onBackdropClick($event)">
      <div class="modal-dialog-custom">
        <div class="confirmation-modal" [ngClass]="'type-' + (data.type || 'warning')">
          <div class="modal-header">
            <div class="header-icon">
              <mat-icon>{{ getIcon() }}</mat-icon>
            </div>
            <h3 class="modal-title">{{ data.title }}</h3>
            <button class="btn-close close-btn" (click)="onCancel()">
              <span>✕</span>
            </button>
          </div>
          
          <div class="modal-body">
            <p class="modal-message">{{ data.message }}</p>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary cancel-btn" (click)="onCancel()">
              {{ data.cancelText || 'Cancel' }}
            </button>
            <button class="btn confirm-btn" [ngClass]="getConfirmButtonClass()" (click)="onConfirm()">
              {{ data.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop-custom {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(30, 34, 90, 0.35);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-dialog-custom {
      background: transparent;
      border: none;
      box-shadow: none;
      max-width: 95vw;
      z-index: 1060;
      position: relative;
    }

    .confirmation-modal {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.8);
      padding: 0;
      min-width: 400px;
      max-width: 500px;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      flex-shrink: 0;
    }

    .header-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
      flex: 1;
    }

    .btn-close.close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #6c757d;
    }

    .btn-close.close-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #495057;
    }

    .btn-close.close-btn span {
      font-size: 1.2rem;
      font-weight: 600;
      line-height: 1;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-message {
      margin: 0;
      font-size: 1rem;
      line-height: 1.5;
      color: #495057;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem 1.5rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 100px;
    }

    .btn-secondary {
      background: linear-gradient(135deg, #6c757d 0%, #95a5a6 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, #5a6268 0%, #7f8c8d 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
    }

    .confirm-btn {
      color: white;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .confirm-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    /* Type-specific styling */
    .type-warning .header-icon {
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
    }

    .type-warning .confirm-btn {
      background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
    }

    .type-warning .confirm-btn:hover {
      background: linear-gradient(135deg, #e0a800 0%, #d39e00 100%);
    }

    .type-danger .header-icon {
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
    }

    .type-danger .confirm-btn {
      background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
    }

    .type-danger .confirm-btn:hover {
      background: linear-gradient(135deg, #c82333 0%, #c0392b 100%);
    }

    .type-info .header-icon {
      background: rgba(23, 162, 184, 0.1);
      color: #17a2b8;
    }

    .type-info .confirm-btn {
      background: linear-gradient(135deg, #17a2b8 0%, #3498db 100%);
    }

    .type-info .confirm-btn:hover {
      background: linear-gradient(135deg, #138496 0%, #2980b9 100%);
    }

    .type-success .header-icon {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
    }

    .type-success .confirm-btn {
      background: linear-gradient(135deg, #28a745 0%, #2ecc71 100%);
    }

    .type-success .confirm-btn:hover {
      background: linear-gradient(135deg, #218838 0%, #27ae60 100%);
    }

    @media (max-width: 480px) {
      .confirmation-modal {
        min-width: 90vw;
        margin: 1rem;
      }

      .modal-footer {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  @Input() data!: ConfirmationDialogData;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check_circle';
      default:
        return 'help';
    }
  }

  getConfirmButtonClass(): string {
    return `btn-${this.data.type || 'warning'}`;
  }
}






