import { Injectable, Inject } from '../src/injectable';
import { Directive } from '../src/directive';
import { Component } from '../src/component';
import { NgModule, Run, Config } from '../src/module';
import { Input, Output } from '../src/input';
import { AfterViewInit, DoCheck, OnChanges, OnDestroy, OnInit, SimpleChanges } from '../src/lifecycle_hooks';
import { HostListener } from '../src/hostListener';
import { ViewChild, ViewChildren } from '../src/viewChild';

export const serviceName = 'TestService';

@Injectable(serviceName)
export class TestService {
  private someProp = 'This is private property';

  static someStaticMethod() {
    return 'This is static method';
  }

  constructor(@Inject('$http') private $http: any) {}

  someMethod(): string {
    return this.someProp;
  }
}

export function directive(selector: string) {
  @Component({
    selector: 'child'
  })
  class ChildComponent {}

  @Directive({
    selector,
    scope: true
  })
  class MyDirective {
    @Input() testInput;
    @Output() testOutput;
    @ViewChild(ChildComponent) child;

    constructor(@Inject('$log') private $log: ng.ILogService,
                @Inject('$parse') private $parse: ng.IParseService) { }
    $onInit() {
      console.log(this.$log, this.$parse);
    }

    @HostListener('click')
    onClick() {
      console.log('click');
    }
  }
  return MyDirective;
}

export function component(selector: string) {
  @Component({
    selector: 'child'
  })
  class ChildComponent {}

  @Component({
    selector
  })
  class MyComponent implements OnInit, OnChanges, DoCheck, OnDestroy, AfterViewInit {
    @Input() testInput;
    @Output() testOutput;
    @ViewChild(ChildComponent) child;

    constructor(private $log: ng.ILogService,
                private $parse: ng.IParseService) { }
    ngOnInit() {
      console.log(this.$log, this.$parse);
    }

    ngOnChanges(changes: SimpleChanges) {
      console.log(this.$log, this.$parse);
    }

    ngDoCheck() {
      console.log(this.$log, this.$parse);
    }

    ngOnDestroy() {}

    ngAfterViewInit() {}

    @HostListener('click')
    onClick() {
      console.log('click');
    }
  }
  return MyComponent;
}

export const registerNgModule = (name: string = '',
                                 imports: any[] = [],
                                 declarations: any[] = [],
                                 providers: any[] = []): any => {

  @NgModule({
    id: name,
    imports,
    declarations,
    providers,
  })
  class TestModule {
    static config($httpProvider: ng.IHttpProvider) {}

    static run($rootScope: ng.IRootScopeService) {}

  }

  return TestModule;
};

@NgModule({
  id: 'ronny'
})
export class RonnyTheRunModule {

   @Run()
   public someRunMethod(@Inject('$transitions') $transitions, @Inject('$state') $state) {}

   @Run()
   public otherRunMethod(@Inject('$log') $log) {}
}


@NgModule({
  id: 'conny'
})
export class ConnyTheConfigModule {

   @Config()
   public someConfigMethod(@Inject('$transitions') $transitions, @Inject('$state') $state) {}

   @Config()
   public otherConfigMethod() {}
}


@Component({
  selector: 'test-injectables'
})
export class MethodInjectables {
  constructor(@Inject('x') x, @Inject('y') y, @Inject('z') z) {}
  public someMethod(@Inject('a') a, @Inject('b') b) {}
  public otherMethod(@Inject('c') c, @Inject('d') d) {}
}