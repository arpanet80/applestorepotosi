import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCard } from './stat-card.model';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-cards.component.html',
  styleUrls: ['./stats-cards.component.css']
})
export class StatsCardsComponent {
  @Input() cards: StatCard[] = [];
  @Input() columnClass = 'col-xl-3'; // default, puedes cambiarlo
}