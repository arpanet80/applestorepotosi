import { AfterViewInit, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';
import { AuthService } from '../../../auth/services/auth.service';

declare var KTMenu: any;
declare var KTDrawer: any;
declare var KTScroll: any;
declare var KTThemeMode: any;
declare var KTToggle: any;
declare var bootstrap: any;

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Header, Footer, Breadcrumbs],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit, AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private keenInitialized = false;
  private themeChangeHandler: any;

  userName = 'Usuario';
  userRole = '';
  userAvatar = 'U';
  showUserMenu = false;

  ngOnInit(): void {
    console.log('🎨 MainLayout: Inicializando...');
    
    // Cargar el tema guardado sin reinicializar componentes
    this.loadSavedTheme();
  }

  ngAfterViewInit(): void {
    // Solo inicializar una vez
    if (!this.keenInitialized) {
      console.log('🎨 MainLayout: Inicializando componentes de Keen...');
      this.initKeenComponents();
      this.setupThemeChangeListener();
      this.keenInitialized = true;
    }
  }

  ngOnDestroy(): void {
    // Limpiar el listener al destruir el componente
    if (this.themeChangeHandler) {
      document.removeEventListener('kt.thememode.change', this.themeChangeHandler);
    }
  }

  private loadSavedTheme(): void {
    // Keen guarda el tema en localStorage como 'kt_theme_mode_value'
    const savedTheme = localStorage.getItem('kt_theme_mode_value');
    if (savedTheme && typeof KTThemeMode !== 'undefined') {
      console.log('🎨 Tema guardado detectado:', savedTheme);
      // No hacer nada, Keen lo maneja automáticamente
    }
  }

  private setupThemeChangeListener(): void {
    // Escuchar cambios de tema sin reinicializar el componente
    this.themeChangeHandler = (e: CustomEvent) => {
      console.log('🎨 Cambio de tema detectado:', e.detail);
      // Solo actualizar el tema, no reinicializar componentes
      this.updateThemeClasses(e.detail);
    };

    document.addEventListener('kt.thememode.change', this.themeChangeHandler);
  }

  private updateThemeClasses(theme: string): void {
    // Actualizar clases sin reinicializar componentes
    const html = document.documentElement;
    html.setAttribute('data-bs-theme', theme);
    console.log('🎨 Tema actualizado a:', theme);
  }

  private initKeenComponents(): void {
    // Usar setTimeout para asegurar que el DOM esté completamente cargado
    setTimeout(() => {
      try {
        // Inicializar toggles (IMPORTANTE para el sidebar toggle)
        if (typeof KTToggle !== 'undefined') {
          console.log('🔘 Inicializando KTToggle...');
          KTToggle.createInstances();
        }
        
        // Inicializar menús
        if (typeof KTMenu !== 'undefined') {
          console.log('📋 Inicializando KTMenu...');
          KTMenu.createInstances();
        }
        
        // Inicializar drawers
        if (typeof KTDrawer !== 'undefined') {
          console.log('🎨 Inicializando KTDrawer...');
          KTDrawer.createInstances();
        }
        
        // Inicializar scroll
        if (typeof KTScroll !== 'undefined') {
          console.log('📜 Inicializando KTScroll...');
          KTScroll.createInstances();
        }

        // Inicializar modo de tema (pero no forzar cambios)
        if (typeof KTThemeMode !== 'undefined') {
          console.log('🎨 Inicializando KTThemeMode...');
          KTThemeMode.init();
        }

        // Inicializar tooltips de Bootstrap 5 (Keen)
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
          // console.log('🔧 Inicializando Tooltips');
          const tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]')
          );
          tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));
        }

        console.log('✅ Componentes de Keen inicializados correctamente');
      } catch (error) {
        console.error('❌ Error al inicializar componentes de Keen:', error);
      }
    }, 300);
  }

  // Método para cambiar el tema manualmente si es necesario
  changeTheme(theme: 'light' | 'dark'): void {
    if (typeof KTThemeMode !== 'undefined') {
      KTThemeMode.setMode(theme);
      console.log('🎨 Tema cambiado manualmente a:', theme);
    }
  }

  private initTooltips(): void {
    if (typeof bootstrap === 'undefined') return;
    // destruye los anteriores (si los hubiera)
    (document.querySelectorAll('[data-bs-toggle="tooltip"]') as any)
      .forEach((el: HTMLElement) => bootstrap.Tooltip.getInstance(el)?.dispose());

    // crea los nuevos
    const list = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    list.map((el: HTMLElement) => new bootstrap.Tooltip(el));
  }
}