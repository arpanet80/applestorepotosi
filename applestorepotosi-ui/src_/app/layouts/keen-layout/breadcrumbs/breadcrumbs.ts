import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { Meta, MetaDefinition } from '@angular/platform-browser';
import { ActivationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breadcrumbs.html',
  styleUrls: ['./breadcrumbs.css']
})
export class Breadcrumbs implements OnInit {

  private meta = inject(Meta);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  titulo = '';
  subtitulo = '';
  rutaBreadcrumbs = '';

  ngOnInit(): void {
    // 1. Lee sincrónicamente la ruta actual
    this.readRouteData(this.router.routerState.root);

    // 2. Continúa escuchando cambios futuros
    this.router.events
      .pipe(
        filter(e => e instanceof ActivationEnd),
        map(() => this.router.routerState.root),
        map(route => {
          while (route?.firstChild) route = route.firstChild;
          return route?.snapshot?.data ?? {};
        })
      )
      .subscribe(data => this.applyData(data));
  }

  private readRouteData(route: any): void {
    let r = route;
    while (r?.firstChild) r = r.firstChild;
    this.applyData(r?.snapshot?.data ?? {});
  }

  private applyData(data: any): void {
    this.titulo = data['titulo'] ?? '';
    this.subtitulo = data['subtitulo'] ?? '';
    this.rutaBreadcrumbs = data['rutaBreadcrumbs'] ?? '';

    const metaTag: MetaDefinition = { name: 'description', content: this.titulo };
    this.meta.updateTag(metaTag);

    this.cdr.markForCheck();
  }
}