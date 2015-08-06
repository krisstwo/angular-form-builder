(function() {
  var copyObjectToScope;

  copyObjectToScope = function(object, scope) {

    /*
    Copy object (ng-repeat="object in objects") to scope without `hashKey`.
     */
    var key, value;
    for (key in object) {
      value = object[key];
      if (key !== '$$hashKey') {
        scope[key] = value;
      }
    }
  };

  angular.module('builder.controller', ['builder.provider']).controller('fbFormObjectEditableController', [
    '$scope', '$injector', function($scope, $injector) {
      var $builder;
      $builder = $injector.get('$builder');
      $scope.setupScope = function(formObject) {

        /*
        1. Copy origin formObject (ng-repeat="object in formObjects") to scope.
        2. Setup optionsText with formObject.options.
        3. Watch scope.label, .description, .placeholder, .required, .options then copy to origin formObject.
        4. Watch scope.optionsText then convert to scope.options.
        5. setup validationOptions
         */
        var component, option, _i, _len, _ref;
        copyObjectToScope(formObject, $scope);
        $scope.optionsText = '';
        _ref = formObject.options;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          option = _ref[_i];
          $scope.optionsText += option.label + '\n';
        }
        $scope.$watch('[label, description, placeholder, required, options, validation]', function() {
          formObject.label = $scope.label;
          formObject.description = $scope.description;
          formObject.placeholder = $scope.placeholder;
          formObject.required = $scope.required;
          formObject.options = $scope.options;
          return formObject.validation = $scope.validation;
        }, true);
        $scope.$watch('optionsText', function(text) {
          var i, x;
          $scope.options = (function() {
            var _j, _len1, _ref1, _results;
            _ref1 = text.split('\n');
            _results = [];
            for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
              x = _ref1[i];
              if (x.length > 0) {
                _results.push({
                  value: i + '',
                  label: x
                });
              }
            }
            return _results;
          })();
          if ($scope.options[0]) {
            return $scope.inputText = $scope.options[0].label;
          }
        });
        component = $builder.components[formObject.component];
        return $scope.validationOptions = component.validationOptions;
      };
      return $scope.data = {
        model: null,
        backup: function() {

          /*
          Backup input value.
           */
          return this.model = {
            label: $scope.label,
            description: $scope.description,
            placeholder: $scope.placeholder,
            required: $scope.required,
            optionsText: $scope.optionsText,
            validation: $scope.validation
          };
        },
        rollback: function() {

          /*
          Rollback input value.
           */
          if (!this.model) {
            return;
          }
          $scope.label = this.model.label;
          $scope.description = this.model.description;
          $scope.placeholder = this.model.placeholder;
          $scope.required = this.model.required;
          $scope.optionsText = this.model.optionsText;
          return $scope.validation = this.model.validation;
        }
      };
    }
  ]).controller('fbComponentsController', [
    '$scope', '$injector', function($scope, $injector) {
      var $builder;
      $builder = $injector.get('$builder');
      $scope.selectGroup = function($event, group) {
        var component, name, _ref, _results;
        if ($event != null) {
          $event.preventDefault();
        }
        $scope.activeGroup = group;
        $scope.components = [];
        _ref = $builder.components;
        _results = [];
        for (name in _ref) {
          component = _ref[name];
          if (component.group === group) {
            _results.push($scope.components.push(component));
          }
        }
        return _results;
      };
      $scope.groups = $builder.groups;
      $scope.activeGroup = $scope.groups[0];
      $scope.allComponents = $builder.components;
      return $scope.$watch('allComponents', function() {
        return $scope.selectGroup(null, $scope.activeGroup);
      });
    }
  ]).controller('fbComponentController', [
    '$scope', function($scope) {
      return $scope.copyObjectToScope = function(object) {
        return copyObjectToScope(object, $scope);
      };
    }
  ]).controller('fbFormController', [
    '$scope', '$injector', function($scope, $injector) {
      var $builder, $timeout;
      $builder = $injector.get('$builder');
      $timeout = $injector.get('$timeout');
      if ($scope.input == null) {
        $scope.input = [];
      }
      return $scope.$watch('form', function() {
        if ($scope.input.length > $scope.form.length) {
          $scope.input.splice($scope.form.length);
        }
        return $timeout(function() {
          return $scope.$broadcast($builder.broadcastChannel.updateInput);
        });
      }, true);
    }
  ]).controller('fbFormObjectController', [
    '$scope', '$injector', function($scope, $injector) {
      var $builder;
      $builder = $injector.get('$builder');
      $scope.copyObjectToScope = function(object) {
        return copyObjectToScope(object, $scope);
      };
      return $scope.updateInput = function(value) {

        /*
        Copy current scope.input[X] to $parent.input.
        @param value: The input value.
         */
        var i, input, inserted, valueObject, _i, _len, _ref;
        if (typeof value !== 'string') {
          value = 'JSON:' + JSON.stringify(value);
        }
        input = {
          id: $scope.formObject.id,
          label: $scope.formObject.label,
          value: value != null ? value : ''
        };
        inserted = false;
        _ref = $scope.$parent.input;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          valueObject = _ref[i];
          if (valueObject.id === input.id) {
            $scope.$parent.input[i] = input;
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          return $scope.$parent.input.push(input);
        }
      };
    }
  ]);

}).call(this);

(function() {
  angular.module('builder.directive', ['builder.provider', 'builder.controller', 'builder.drag', 'validator']).directive('fbBuilder', [
    '$injector', function($injector) {
      var $builder, $drag;
      $builder = $injector.get('$builder');
      $drag = $injector.get('$drag');
      return {
        restrict: 'A',
        scope: {
          fbBuilder: '='
        },
        template: "<div class='form-horizontal'>\n    <div ng-repeat=\"fieldset in fieldsets\" fb-fieldset-editable=\"fieldset\">\n    </div>\n</div>",
        link: function(scope, element, attrs) {
          var beginMove;
          scope.formName = attrs.fbBuilder;
          scope.fieldsets = $builder.forms[scope.formName];
          beginMove = true;
          $(element).addClass('fb-builder');
          return $drag.droppable($(element), {
            move: function(e) {
              var $empty, $formObject, $formObjects, height, index, offset, positions, _i, _j, _ref, _ref1;
              if (beginMove) {
                $("div.fb-form-object-editable").popover('hide');
                beginMove = false;
              }
              $formObjects = $(element).find('.fb-form-object-editable:not(.empty,.dragging)');
              if ($formObjects.length === 0) {
                if ($(element).find('.fb-form-object-editable.empty').length === 0) {
                  $(element).find('>div:first').append($("<div class='fb-form-object-editable empty'></div>"));
                }
                return;
              }
              positions = [];
              positions.push(-1000);
              for (index = _i = 0, _ref = $formObjects.length; _i < _ref; index = _i += 1) {
                $formObject = $($formObjects[index]);
                offset = $formObject.offset();
                height = $formObject.height();
                positions.push(offset.top + height / 2);
              }
              positions.push(positions[positions.length - 1] + 1000);
              for (index = _j = 1, _ref1 = positions.length; _j < _ref1; index = _j += 1) {
                if (e.pageY > positions[index - 1] && e.pageY <= positions[index]) {
                  $(element).find('.empty').remove();
                  $empty = $("<div class='fb-form-object-editable empty'></div>");
                  if (index - 1 < $formObjects.length) {
                    $empty.insertBefore($($formObjects[index - 1]));
                  } else {
                    $empty.insertAfter($($formObjects[index - 2]));
                  }
                  break;
                }
              }
            },
            out: function() {
              if (beginMove) {
                $("div.fb-form-object-editable").popover('hide');
                beginMove = false;
              }
              return $(element).find('.empty').remove();
            },
            up: function(e, isHover, draggable) {
              var newFieldset, newIndex, oldIndex;
              beginMove = true;
              if (!$drag.isMouseMoved()) {
                $(element).find('.empty').remove();
                return;
              }
              if (isHover) {
                if (draggable.mode === 'mirror') {
                  $builder.insertFormObject(scope.formName, $(element).find('.empty').index('.fb-form-object-editable'), {
                    component: draggable.object.componentName
                  });
                }
                if (draggable.mode === 'drag') {
                  oldIndex = draggable.object.formObject.index;
                  newIndex = $(element).find('.empty').parent().find('.fb-form-object-editable').index($(element).find('.empty'));
                  newFieldset = $(element).find('.empty').parent().data('fieldsetName');
                  if (newFieldset === draggable.object.formObject.fieldsetName && oldIndex < newIndex) {
                    newIndex--;
                  }
                  $builder.updateFormObjectIndex(scope.formName, draggable.object.formObject.fieldsetName, newFieldset, oldIndex, newIndex);
                }
              }
              return $(element).find('.empty').remove();
            }
          });
        }
      };
    }
  ]).directive('fbFieldsetEditable', [
    '$injector', function($injector) {
      var $builder;
      $builder = $injector.get('$builder');
      return {
        restrict: 'A',
        scope: {
          fieldset: '=fbFieldsetEditable'
        },
        template: "<legend data-ng-if=\"fieldset.name != 'default'\">\n    {{fieldset.label}}\n    <span class=\"pull-right\">\n        <span class=\"glyphicon glyphicon-chevron-up control\" data-ng-click=\"moveFieldsetUp()\"></span>\n        <span class=\"glyphicon glyphicon-chevron-down control\" data-ng-click=\"moveFieldsetDown()\"></span>\n        <span class=\"glyphicon glyphicon-remove control\" data-ng-click=\"removeFieldset()\"></span>\n    </span>\n</legend>\n<div class='fb-form-object-editable' ng-repeat=\"object in fieldset.objects\"\n    fb-form-object-editable=\"object\"></div>",
        link: function(scope, element, attrs) {
          $(element).addClass('fb-fieldset-editable');
          $(element).data('fieldset-name', scope.fieldset.name);
          scope.moveFieldsetUp = function() {
            return $builder.moveFieldsetUp(scope.$parent.formName, scope.fieldset.name);
          };
          scope.moveFieldsetDown = function() {
            return $builder.moveFieldsetDown(scope.$parent.formName, scope.fieldset.name);
          };
          return scope.removeFieldset = function() {
            return $builder.removeFieldset(scope.$parent.formName, scope.fieldset.name);
          };
        }
      };
    }
  ]).directive('fbFormObjectEditable', [
    '$injector', function($injector) {
      var $builder, $compile, $drag, $validator;
      $builder = $injector.get('$builder');
      $drag = $injector.get('$drag');
      $compile = $injector.get('$compile');
      $validator = $injector.get('$validator');
      return {
        restrict: 'A',
        controller: 'fbFormObjectEditableController',
        scope: {
          formObject: '=fbFormObjectEditable'
        },
        link: function(scope, element) {
          var popover;
          scope.inputArray = [];
          scope.$component = $builder.components[scope.formObject.component];
          scope.setupScope(scope.formObject);
          scope.$watch('$component.template', function(template) {
            var view;
            if (!template) {
              return;
            }
            view = $compile(template)(scope);
            return $(element).html(view);
          });
          $(element).on('click', function() {
            return false;
          });
          $drag.draggable($(element), {
            object: {
              formObject: scope.formObject
            }
          });
          if (!scope.formObject.editable) {
            return;
          }
          popover = {};
          scope.$watch('$component.popoverTemplate', function(template) {
            if (!template) {
              return;
            }
            $(element).removeClass(popover.id);
            popover = {
              id: "fb-" + (Math.random().toString().substr(2)),
              isClickedSave: false,
              view: null,
              html: template
            };
            popover.html = $(popover.html).addClass(popover.id);
            popover.view = $compile(popover.html)(scope);
            $(element).addClass(popover.id);
            return $(element).popover({
              html: true,
              title: scope.$component.label,
              content: popover.view,
              container: 'body',
              placement: $builder.config.popoverPlacement
            });
          });
          scope.popover = {
            save: function($event) {

              /*
              The save event of the popover.
               */
              $event.preventDefault();
              $validator.validate(scope).success(function() {
                popover.isClickedSave = true;
                return $(element).popover('hide');
              });
            },
            remove: function($event) {

              /*
              The delete event of the popover.
               */
              $event.preventDefault();
              $builder.removeFormObject(scope.$parent.formName, scope.fieldsetName, scope.$parent.$index);
              $(element).popover('hide');
            },
            shown: function() {

              /*
              The shown event of the popover.
               */
              scope.data.backup();
              return popover.isClickedSave = false;
            },
            cancel: function($event) {

              /*
              The cancel event of the popover.
               */
              scope.data.rollback();
              if ($event) {
                $event.preventDefault();
                $(element).popover('hide');
              }
            }
          };
          $(element).on('show.bs.popover', function() {
            var $popover, elementOrigin, popoverTop;
            if ($drag.isMouseMoved()) {
              return false;
            }
            $("div.fb-form-object-editable:not(." + popover.id + ")").popover('hide');
            $popover = $("form." + popover.id).closest('.popover');
            if ($popover.length > 0) {
              elementOrigin = $(element).offset().top + $(element).height() / 2;
              popoverTop = elementOrigin - $popover.height() / 2;
              $popover.css({
                position: 'absolute',
                top: popoverTop
              });
              $popover.show();
              setTimeout(function() {
                $popover.addClass('in');
                return $(element).triggerHandler('shown.bs.popover');
              }, 0);
              return false;
            }
          });
          $(element).on('shown.bs.popover', function() {
            $(".popover ." + popover.id + " input:first").select();
            scope.$apply(function() {
              return scope.popover.shown();
            });
          });
          return $(element).on('hide.bs.popover', function() {
            var $popover;
            $popover = $("form." + popover.id).closest('.popover');
            if (!popover.isClickedSave) {
              if (scope.$$phase || scope.$root.$$phase) {
                scope.popover.cancel();
              } else {
                scope.$apply(function() {
                  return scope.popover.cancel();
                });
              }
            }
            $popover.removeClass('in');
            setTimeout(function() {
              return $popover.hide();
            }, 300);
            return false;
          });
        }
      };
    }
  ]).directive('fbComponents', function() {
    return {
      restrict: 'A',
      template: "<ul ng-if=\"groups.length > 1\" class=\"nav nav-tabs nav-justified\">\n    <li ng-repeat=\"group in groups\" ng-class=\"{active:activeGroup==group}\">\n        <a href='#' ng-click=\"selectGroup($event, group)\">{{group}}</a>\n    </li>\n</ul>\n<div class='form-horizontal'>\n    <div class='fb-component' ng-repeat=\"component in components\"\n        fb-component=\"component\"></div>\n</div>",
      controller: 'fbComponentsController'
    };
  }).directive('fbComponent', [
    '$injector', function($injector) {
      var $builder, $compile, $drag;
      $builder = $injector.get('$builder');
      $drag = $injector.get('$drag');
      $compile = $injector.get('$compile');
      return {
        restrict: 'A',
        scope: {
          component: '=fbComponent'
        },
        controller: 'fbComponentController',
        link: function(scope, element) {
          scope.copyObjectToScope(scope.component);
          $drag.draggable($(element), {
            mode: 'mirror',
            defer: false,
            object: {
              componentName: scope.component.name
            }
          });
          return scope.$watch('component.template', function(template) {
            var view;
            if (!template) {
              return;
            }
            view = $compile(template)(scope);
            return $(element).html(view);
          });
        }
      };
    }
  ]).directive('fbForm', [
    '$injector', function($injector) {
      return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
          formName: '@fbForm',
          input: '=ngModel',
          "default": '=fbDefault'
        },
        template: "<div class='fb-form-fieldset' ng-repeat=\"fieldset in form\" data-ng-if=\"fieldset.objects.length\">\n    <legend data-ng-if=\"fieldset.name != 'default'\">{{fieldset.label}}</legend>\n    <div class='fb-form-object' ng-repeat=\"object in fieldset.objects\" fb-form-object=\"object\"></div>\n</div>",
        controller: 'fbFormController',
        link: function(scope, element, attrs) {
          var $builder, _ref;
          $builder = $injector.get('$builder');
                    if ((_ref = $builder.forms[scope.formName]) != null) {
            _ref;
          } else {
            $builder.addForm(scope.formName);
          };
          return scope.form = $builder.forms[scope.formName];
        }
      };
    }
  ]).directive('fbFormObject', [
    '$injector', function($injector) {
      var $builder, $compile, $parse;
      $builder = $injector.get('$builder');
      $compile = $injector.get('$compile');
      $parse = $injector.get('$parse');
      return {
        restrict: 'A',
        controller: 'fbFormObjectController',
        link: function(scope, element, attrs) {
          scope.formObject = $parse(attrs.fbFormObject)(scope);
          scope.$component = $builder.components[scope.formObject.component];
          scope.$on($builder.broadcastChannel.updateInput, function() {
            var option, _i, _len, _ref;
            if (!scope.$component.arrayToText && scope.options && scope.options.length) {
              _ref = scope.options;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                option = _ref[_i];
                if (option.value === scope.inputText) {
                  return scope.updateInput(option);
                }
              }
            } else {
              return scope.updateInput(scope.inputText);
            }
          });
          if (scope.$component.arrayToText) {
            scope.inputArray = [];
            scope.$watch('inputArray', function(newValue, oldValue) {
              var checked, index, _ref;
              if (newValue === oldValue) {
                return;
              }
              checked = [];
              for (index in scope.inputArray) {
                if (scope.inputArray[index]) {
                  checked.push((_ref = scope.options[index]) != null ? _ref : scope.inputArray[index]);
                }
              }
              return scope.inputText = checked;
            }, true);
          }
          scope.$watch('inputText', function() {
            var option, _i, _len, _ref;
            if (!scope.$component.arrayToText && scope.options && scope.options.length) {
              _ref = scope.options;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                option = _ref[_i];
                if (option.value === scope.inputText) {
                  return scope.updateInput(option);
                }
              }
            } else {
              return scope.updateInput(scope.inputText);
            }
          });
          scope.$watch(attrs.fbFormObject, function() {
            return scope.copyObjectToScope(scope.formObject);
          }, true);
          scope.$watch('$component.template', function(template) {
            var $input, $template, view;
            if (!template) {
              return;
            }
            $template = $(template);
            $input = $template.find("[validator-group]");
            $input.attr({
              validator: '{{validation}}'
            });
            view = $compile($template)(scope);
            return $(element).html(view);
          });
          if (!scope.$component.arrayToText && scope.formObject.options && scope.formObject.options.length > 0) {
            if (scope.formObject.options[0]) {
              scope.inputText = scope.formObject.options[0].value;
            } else {
              scope.inputText = null;
            }
          }
          return scope.$watch("default['" + scope.formObject.id + "']", function(value) {
            var values, _i, _len;
            if (!value) {
              return;
            }
            if (scope.$component.arrayToText) {
              scope.inputArray = [];
              values = JSON.parse(value.replace('JSON:', ''));
              for (_i = 0, _len = values.length; _i < _len; _i++) {
                value = values[_i];
                scope.inputArray[value.value] = true;
              }
              return scope.inputArray;
            } else {
              if (value.indexOf('JSON:') !== -1) {
                return scope.inputText = (JSON.parse(value.replace('JSON:', ''))).value;
              } else {
                return scope.inputText = value;
              }
            }
          });
        }
      };
    }
  ]);

}).call(this);

(function() {
  angular.module('builder.drag', []).provider('$drag', function() {
    var $injector, $rootScope, delay;
    $injector = null;
    $rootScope = null;
    this.data = {
      draggables: {},
      droppables: {}
    };
    this.mouseMoved = false;
    this.isMouseMoved = (function(_this) {
      return function() {
        return _this.mouseMoved;
      };
    })(this);
    this.hooks = {
      down: {},
      move: {},
      up: {}
    };
    this.eventMouseMove = function() {};
    this.eventMouseUp = function() {};
    $((function(_this) {
      return function() {
        $(document).on('mousedown', function(e) {
          var func, key, _ref;
          _this.mouseMoved = false;
          _ref = _this.hooks.down;
          for (key in _ref) {
            func = _ref[key];
            func(e);
          }
        });
        $(document).on('mousemove', function(e) {
          var func, key, _ref;
          _this.mouseMoved = true;
          _ref = _this.hooks.move;
          for (key in _ref) {
            func = _ref[key];
            func(e);
          }
        });
        return $(document).on('mouseup', function(e) {
          var func, key, _ref;
          _ref = _this.hooks.up;
          for (key in _ref) {
            func = _ref[key];
            func(e);
          }
        });
      };
    })(this));
    this.currentId = 0;
    this.getNewId = (function(_this) {
      return function() {
        return "" + (_this.currentId++);
      };
    })(this);
    this.setupEasing = function() {
      return jQuery.extend(jQuery.easing, {
        easeOutQuad: function(x, t, b, c, d) {
          return -c * (t /= d) * (t - 2) + b;
        }
      });
    };
    this.setupProviders = function(injector) {

      /*
      Setup providers.
       */
      $injector = injector;
      return $rootScope = $injector.get('$rootScope');
    };
    this.isHover = (function(_this) {
      return function($elementA, $elementB) {

        /*
        Is element A hover on element B?
        @param $elementA: jQuery object
        @param $elementB: jQuery object
         */
        var isHover, offsetA, offsetB, sizeA, sizeB;
        offsetA = $elementA.offset();
        offsetB = $elementB.offset();
        sizeA = {
          width: $elementA.width(),
          height: $elementA.height()
        };
        sizeB = {
          width: $elementB.width(),
          height: $elementB.height()
        };
        isHover = {
          x: false,
          y: false
        };
        isHover.x = offsetA.left > offsetB.left && offsetA.left < offsetB.left + sizeB.width;
        isHover.x = isHover.x || offsetA.left + sizeA.width > offsetB.left && offsetA.left + sizeA.width < offsetB.left + sizeB.width;
        if (!isHover) {
          return false;
        }
        isHover.y = offsetA.top > offsetB.top && offsetA.top < offsetB.top + sizeB.height;
        isHover.y = isHover.y || offsetA.top + sizeA.height > offsetB.top && offsetA.top + sizeA.height < offsetB.top + sizeB.height;
        return isHover.x && isHover.y;
      };
    })(this);
    delay = function(ms, func) {
      return setTimeout(function() {
        return func();
      }, ms);
    };
    this.autoScroll = {
      up: false,
      down: false,
      scrolling: false,
      scroll: (function(_this) {
        return function() {
          _this.autoScroll.scrolling = true;
          if (_this.autoScroll.up) {
            $('html, body').dequeue().animate({
              scrollTop: $(window).scrollTop() - 50
            }, 100, 'easeOutQuad');
            return delay(100, function() {
              return _this.autoScroll.scroll();
            });
          } else if (_this.autoScroll.down) {
            $('html, body').dequeue().animate({
              scrollTop: $(window).scrollTop() + 50
            }, 100, 'easeOutQuad');
            return delay(100, function() {
              return _this.autoScroll.scroll();
            });
          } else {
            return _this.autoScroll.scrolling = false;
          }
        };
      })(this),
      start: (function(_this) {
        return function(e) {
          if (e.clientY < 50) {
            _this.autoScroll.up = true;
            _this.autoScroll.down = false;
            if (!_this.autoScroll.scrolling) {
              return _this.autoScroll.scroll();
            }
          } else if (e.clientY > $(window).innerHeight() - 50) {
            _this.autoScroll.up = false;
            _this.autoScroll.down = true;
            if (!_this.autoScroll.scrolling) {
              return _this.autoScroll.scroll();
            }
          } else {
            _this.autoScroll.up = false;
            return _this.autoScroll.down = false;
          }
        };
      })(this),
      stop: (function(_this) {
        return function() {
          _this.autoScroll.up = false;
          return _this.autoScroll.down = false;
        };
      })(this)
    };
    this.dragMirrorMode = (function(_this) {
      return function($element, defer, object) {
        var result;
        if (defer == null) {
          defer = true;
        }
        result = {
          id: _this.getNewId(),
          mode: 'mirror',
          maternal: $element[0],
          element: null,
          object: object
        };
        $element.on('mousedown', function(e) {
          var $clone;
          e.preventDefault();
          $clone = $element.clone();
          result.element = $clone[0];
          $clone.addClass("fb-draggable form-horizontal prepare-dragging");
          _this.hooks.move.drag = function(e, defer) {
            var droppable, id, _ref, _results;
            if ($clone.hasClass('prepare-dragging')) {
              $clone.css({
                width: $element.width(),
                height: $element.height()
              });
              $clone.removeClass('prepare-dragging');
              $clone.addClass('dragging');
              if (defer) {
                return;
              }
            }
            $clone.offset({
              left: e.pageX - $clone.width() / 2,
              top: e.pageY - $clone.height() / 2
            });
            _this.autoScroll.start(e);
            _ref = _this.data.droppables;
            _results = [];
            for (id in _ref) {
              droppable = _ref[id];
              if (_this.isHover($clone, $(droppable.element))) {
                _results.push(droppable.move(e, result));
              } else {
                _results.push(droppable.out(e, result));
              }
            }
            return _results;
          };
          _this.hooks.up.drag = function(e) {
            var droppable, id, isHover, _ref;
            _ref = _this.data.droppables;
            for (id in _ref) {
              droppable = _ref[id];
              isHover = _this.isHover($clone, $(droppable.element));
              droppable.up(e, isHover, result);
            }
            delete _this.hooks.move.drag;
            delete _this.hooks.up.drag;
            result.element = null;
            $clone.remove();
            return _this.autoScroll.stop();
          };
          $('body').append($clone);
          if (!defer) {
            return _this.hooks.move.drag(e, defer);
          }
        });
        return result;
      };
    })(this);
    this.dragDragMode = (function(_this) {
      return function($element, defer, object) {
        var result;
        if (defer == null) {
          defer = true;
        }
        result = {
          id: _this.getNewId(),
          mode: 'drag',
          maternal: null,
          element: $element[0],
          object: object
        };
        $element.addClass('fb-draggable');
        $element.on('mousedown', function(e) {
          e.preventDefault();
          if ($element.hasClass('dragging')) {
            return;
          }
          $element.addClass('prepare-dragging');
          _this.hooks.move.drag = function(e, defer) {
            var droppable, id, _ref;
            if ($element.hasClass('prepare-dragging')) {
              $element.css({
                width: $element.width(),
                height: $element.height()
              });
              $element.removeClass('prepare-dragging');
              $element.addClass('dragging');
              if (defer) {
                return;
              }
            }
            $element.offset({
              left: e.pageX - $element.width() / 2,
              top: e.pageY - $element.height() / 2
            });
            _this.autoScroll.start(e);
            _ref = _this.data.droppables;
            for (id in _ref) {
              droppable = _ref[id];
              if (_this.isHover($element, $(droppable.element))) {
                droppable.move(e, result);
              } else {
                droppable.out(e, result);
              }
            }
          };
          _this.hooks.up.drag = function(e) {
            var droppable, id, isHover, _ref;
            _ref = _this.data.droppables;
            for (id in _ref) {
              droppable = _ref[id];
              isHover = _this.isHover($element, $(droppable.element));
              droppable.up(e, isHover, result);
            }
            delete _this.hooks.move.drag;
            delete _this.hooks.up.drag;
            $element.css({
              width: '',
              height: '',
              left: '',
              top: ''
            });
            $element.removeClass('dragging defer-dragging');
            return _this.autoScroll.stop();
          };
          if (!defer) {
            return _this.hooks.move.drag(e, defer);
          }
        });
        return result;
      };
    })(this);
    this.dropMode = (function(_this) {
      return function($element, options) {
        var result;
        result = {
          id: _this.getNewId(),
          element: $element[0],
          move: function(e, draggable) {
            return $rootScope.$apply(function() {
              return typeof options.move === "function" ? options.move(e, draggable) : void 0;
            });
          },
          up: function(e, isHover, draggable) {
            return $rootScope.$apply(function() {
              return typeof options.up === "function" ? options.up(e, isHover, draggable) : void 0;
            });
          },
          out: function(e, draggable) {
            return $rootScope.$apply(function() {
              return typeof options.out === "function" ? options.out(e, draggable) : void 0;
            });
          }
        };
        return result;
      };
    })(this);
    this.draggable = (function(_this) {
      return function($element, options) {
        var draggable, element, result, _i, _j, _len, _len1;
        if (options == null) {
          options = {};
        }

        /*
        Make the element could be drag.
        @param element: The jQuery element.
        @param options: Options
            mode: 'drag' [default], 'mirror'
            defer: yes/no. defer dragging
            object: custom information
         */
        result = [];
        if (options.mode === 'mirror') {
          for (_i = 0, _len = $element.length; _i < _len; _i++) {
            element = $element[_i];
            draggable = _this.dragMirrorMode($(element), options.defer, options.object);
            result.push(draggable.id);
            _this.data.draggables[draggable.id] = draggable;
          }
        } else {
          for (_j = 0, _len1 = $element.length; _j < _len1; _j++) {
            element = $element[_j];
            draggable = _this.dragDragMode($(element), options.defer, options.object);
            result.push(draggable.id);
            _this.data.draggables[draggable.id] = draggable;
          }
        }
        return result;
      };
    })(this);
    this.droppable = (function(_this) {
      return function($element, options) {
        var droppable, element, result, _i, _len;
        if (options == null) {
          options = {};
        }

        /*
        Make the element coulde be drop.
        @param $element: The jQuery element.
        @param options: The droppable options.
            move: The custom mouse move callback. (e, draggable)->
            up: The custom mouse up callback. (e, isHover, draggable)->
            out: The custom mouse out callback. (e, draggable)->
         */
        result = [];
        for (_i = 0, _len = $element.length; _i < _len; _i++) {
          element = $element[_i];
          droppable = _this.dropMode($(element), options);
          result.push(droppable);
          _this.data.droppables[droppable.id] = droppable;
        }
        return result;
      };
    })(this);
    this.get = function($injector) {
      this.setupEasing();
      this.setupProviders($injector);
      return {
        isMouseMoved: this.isMouseMoved,
        data: this.data,
        draggable: this.draggable,
        droppable: this.droppable
      };
    };
    this.get.$inject = ['$injector'];
    this.$get = this.get;
  });

}).call(this);

(function() {
  angular.module('builder', ['builder.directive']);

}).call(this);


/*
    component:
        It is like a class.
        The base components are textInput, textArea, select, check, radio.
        User can custom the form with components.
    formObject:
        It is like an object (an instance of the component).
        User can custom the label, description, required and validation of the input.
    form:
        This is for end-user. There are form groups int the form.
        They can input the value to the form.
 */

(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  angular.module('builder.provider', []).provider('$builder', function() {
    var $http, $injector, $templateCache;
    $injector = null;
    $http = null;
    $templateCache = null;
    this.config = {
      popoverPlacement: 'right'
    };
    this.components = {};
    this.groups = [];
    this.broadcastChannel = {
      updateInput: '$updateInput'
    };
    this.forms = {};
    this.convertComponent = function(name, component) {
      var result, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      result = {
        name: name,
        group: (_ref = component.group) != null ? _ref : 'Default',
        label: (_ref1 = component.label) != null ? _ref1 : '',
        description: (_ref2 = component.description) != null ? _ref2 : '',
        placeholder: (_ref3 = component.placeholder) != null ? _ref3 : '',
        editable: (_ref4 = component.editable) != null ? _ref4 : true,
        required: (_ref5 = component.required) != null ? _ref5 : false,
        validation: (_ref6 = component.validation) != null ? _ref6 : '/.*/',
        validationOptions: (_ref7 = component.validationOptions) != null ? _ref7 : [],
        options: (_ref8 = component.options) != null ? _ref8 : [],
        arrayToText: (_ref9 = component.arrayToText) != null ? _ref9 : false,
        template: component.template,
        templateUrl: component.templateUrl,
        popoverTemplate: component.popoverTemplate,
        popoverTemplateUrl: component.popoverTemplateUrl
      };
      if (!result.template && !result.templateUrl) {
        console.error("The template is empty.");
      }
      if (!result.popoverTemplate && !result.popoverTemplateUrl) {
        console.error("The popoverTemplate is empty.");
      }
      return result;
    };
    this.createEmptyForm = (function(_this) {
      return function() {
        return [
          {
            name: 'default',
            label: '',
            objects: []
          }
        ];
      };
    })(this);
    this.addForm = (function(_this) {
      return function(name) {
        return _this.forms[name] = _this.createEmptyForm();
      };
    })(this);
    this.getFieldsetIndexInForm = function(fieldset, form) {
      var index, _i, _ref;
      if (!this.forms[form]) {
        return console.error("The form " + form + " is inexesitant.");
      }
      for (index = _i = 0, _ref = this.forms[form].length; _i < _ref; index = _i += 1) {
        if (this.forms[form][index]['name'] === fieldset) {
          return index;
        }
      }
      return -1;
    };
    this.convertFormObject = function(fieldsetName, formObject) {
      var component, result, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if (formObject == null) {
        formObject = {};
      }
      component = this.components[formObject.component];
      if (component == null) {
        throw "The component " + formObject.component + " was not registered.";
      }
      result = {
        id: formObject.id,
        component: formObject.component,
        fieldsetName: fieldsetName,
        editable: (_ref = formObject.editable) != null ? _ref : component.editable,
        index: (_ref1 = formObject.index) != null ? _ref1 : 0,
        label: (_ref2 = formObject.label) != null ? _ref2 : component.label,
        description: (_ref3 = formObject.description) != null ? _ref3 : component.description,
        placeholder: (_ref4 = formObject.placeholder) != null ? _ref4 : component.placeholder,
        options: (_ref5 = formObject.options) != null ? _ref5 : component.options,
        required: (_ref6 = formObject.required) != null ? _ref6 : component.required,
        validation: (_ref7 = formObject.validation) != null ? _ref7 : component.validation
      };
      return result;
    };
    this.reindexFormObject = (function(_this) {
      return function(name) {
        var fieldsetIndex, index, _i, _j, _ref, _ref1;
        for (fieldsetIndex = _i = 0, _ref = _this.forms[name].length; _i < _ref; fieldsetIndex = _i += 1) {
          for (index = _j = 0, _ref1 = _this.forms[name][fieldsetIndex].objects.length; _j < _ref1; index = _j += 1) {
            _this.forms[name][fieldsetIndex].objects[index].index = index;
          }
        }
      };
    })(this);
    this.setupProviders = (function(_this) {
      return function(injector) {
        $injector = injector;
        $http = $injector.get('$http');
        return $templateCache = $injector.get('$templateCache');
      };
    })(this);
    this.loadTemplate = function(component) {

      /*
      Load template for components.
      @param component: {object} The component of $builder.
       */
      if (component.template == null) {
        $http.get(component.templateUrl, {
          cache: $templateCache
        }).success(function(template) {
          return component.template = template;
        });
      }
      if (component.popoverTemplate == null) {
        return $http.get(component.popoverTemplateUrl, {
          cache: $templateCache
        }).success(function(template) {
          return component.popoverTemplate = template;
        });
      }
    };
    this.updateFieldsetIndex = (function(_this) {
      return function(formName, fieldsetName, newIndex) {
        var fieldsetObject, oldIndex;
        oldIndex = _this.getFieldsetIndexInForm(fieldsetName, formName);
        if (newIndex > _this.forms[formName].length - 1) {
          newIndex = _this.forms[formName].length - 1;
        } else if (newIndex <= 0) {
          newIndex = 1;
        }
        if (newIndex === oldIndex) {
          return;
        }
        fieldsetObject = _this.forms[formName].splice(oldIndex, 1);
        return _this.forms[formName].splice(newIndex, 0, fieldsetObject[0]);
      };
    })(this);
    this.registerComponent = (function(_this) {
      return function(name, component) {
        var newComponent, _ref;
        if (component == null) {
          component = {};
        }

        /*
        Register the component for form-builder.
        @param name: The component name.
        @param component: The component object.
            group: {string} The component group.
            label: {string} The label of the input.
            description: {string} The description of the input.
            placeholder: {string} The placeholder of the input.
            editable: {bool} Is the form object editable?
            required: {bool} Is the form object required?
            validation: {string} angular-validator. "/regex/" or "[rule1, rule2]". (default is RegExp(.*))
            validationOptions: {array} [{rule: angular-validator, label: 'option label'}] the options for the validation. (default is [])
            options: {array} The input options.
            arrayToText: {bool} checkbox could use this to convert input (default is no)
            template: {string} html template
            templateUrl: {string} The url of the template.
            popoverTemplate: {string} html template
            popoverTemplateUrl: {string} The url of the popover template.
         */
        if (_this.components[name] == null) {
          newComponent = _this.convertComponent(name, component);
          _this.components[name] = newComponent;
          if ($injector != null) {
            _this.loadTemplate(newComponent);
          }
          if (_ref = newComponent.group, __indexOf.call(_this.groups, _ref) < 0) {
            _this.groups.push(newComponent.group);
          }
        } else {
          console.error("The component " + name + " was registered.");
        }
      };
    })(this);
    this.addFormObject = (function(_this) {
      return function(name, fieldset, formObject) {

        /*
        Insert the form object into the form at last.
         */
        return _this.insertFormObject(name, fieldset, 'last', formObject);
      };
    })(this);
    this.insertFormObject = (function(_this) {
      return function(name, fieldset, index, formObject) {
        var fieldsetIndex, _base;
        if (fieldset == null) {
          fieldset = 'default';
        }
        if (formObject == null) {
          formObject = {};
        }

        /*
        Insert the form object into the form at {index}.
        @param name: The form name.
        @param fieldset: The fieldsetname name.
        @param index: The form object index.
        @param form: The form object.
            id: The form object id.
            component: {string} The component name
            editable: {bool} Is the form object editable? (default is yes)
            label: {string} The form object label.
            description: {string} The form object description.
            placeholder: {string} The form object placeholder.
            options: {array} The form object options.
            required: {bool} Is the form object required? (default is no)
            validation: {string} angular-validator. "/regex/" or "[rule1, rule2]".
            [index]: {int} The form object index. It will be updated by $builder.
        @return: The form object.
         */
        if ((_base = _this.forms)[name] == null) {
          _base[name] = _this.createEmptyForm();
        }
        fieldsetIndex = _this.getFieldsetIndexInForm(fieldset, name);
        if (fieldsetIndex === -1) {
          console.error("Fieldset '" + fieldset + "' not found in form '" + name + "'.");
          return;
        }
        if (index > _this.forms[name][fieldsetIndex].length) {
          index = _this.forms[name][fieldsetIndex].length;
        } else if (index < 0) {
          index = 0;
        }
        _this.forms[name][fieldsetIndex].objects.splice(index, 0, _this.convertFormObject(_this.forms[name][fieldsetIndex].name, formObject));
        _this.reindexFormObject(name);
        return _this.forms[name][fieldsetIndex].objects[index];
      };
    })(this);
    this.removeFormObject = (function(_this) {
      return function(name, fieldset, index) {
        var fieldsetIndex, formObjects;
        if (fieldset == null) {
          fieldset = 'default';
        }

        /*
        Remove the form object by the index.
        @param name: The form name.
        @param fieldset: The fieldset name.
        @param index: The form object index.
         */
        fieldsetIndex = _this.getFieldsetIndexInForm(fieldset, name);
        if (fieldsetIndex === -1) {
          console.error("Fieldset '" + fieldset + "'' not found in form '" + name + "'.");
          return;
        }
        formObjects = _this.forms[name][fieldsetIndex].objects;
        formObjects.splice(index, 1);
        return _this.reindexFormObject(name);
      };
    })(this);
    this.updateFormObjectIndex = (function(_this) {
      return function(name, oldFieldset, newFieldset, oldIndex, newIndex) {

        /*
        Update the index of the form object.
        @param name: The form name.
        @param oldFieldset: The oldFieldset name.
        @param newFieldset: The newFieldset name.
        @param oldIndex: The old index.
        @param newIndex: The new index.
         */
        var formObject, formObjects, newFieldsetIndex, oldFieldsetIndex;
        if (oldIndex === newIndex) {
          return;
        }
        oldFieldsetIndex = _this.getFieldsetIndexInForm(oldFieldset, name);
        if (oldFieldsetIndex === -1) {
          console.error("Fieldset '" + oldFieldset + "'' not found in form '" + name + "'.");
          return;
        }
        newFieldsetIndex = _this.getFieldsetIndexInForm(newFieldset, name);
        if (newFieldsetIndex === -1) {
          console.error("Fieldset '" + newFieldset + "'' not found in form '" + name + "'.");
          return;
        }
        formObjects = _this.forms[name][oldFieldsetIndex].objects;
        formObject = formObjects.splice(oldIndex, 1)[0];
        formObject.fieldsetName = _this.forms[name][newFieldsetIndex].name;
        formObjects = _this.forms[name][newFieldsetIndex].objects;
        formObjects.splice(newIndex, 0, formObject);
        return _this.reindexFormObject(name);
      };
    })(this);
    this.moveFieldsetUp = (function(_this) {
      return function(formName, fieldsetName) {
        var newIndex, oldIndex;
        oldIndex = _this.getFieldsetIndexInForm(fieldsetName, formName);
        newIndex = oldIndex - 1;
        return _this.updateFieldsetIndex(formName, fieldsetName, newIndex);
      };
    })(this);
    this.moveFieldsetDown = (function(_this) {
      return function(formName, fieldsetName) {
        var newIndex, oldIndex;
        oldIndex = _this.getFieldsetIndexInForm(fieldsetName, formName);
        newIndex = oldIndex + 1;
        return _this.updateFieldsetIndex(formName, fieldsetName, newIndex);
      };
    })(this);
    this.removeFieldset = (function(_this) {
      return function(formName, fieldsetName) {
        var index;
        index = _this.getFieldsetIndexInForm(fieldsetName, formName);
        $('div.fb-form-object-editable').popover('hide');
        return _this.forms[formName].splice(index, 1);
      };
    })(this);
    this.addFieldsetToForm = (function(_this) {
      return function(fieldset, form) {
        var newFieldset, _base, _ref, _ref1;
        if ((_base = _this.forms)[form] == null) {
          _base[form] = _this.createEmptyForm();
        }
        newFieldset = {
          name: (_ref = fieldset.name) != null ? _ref : fieldset.label,
          label: (_ref1 = fieldset.label) != null ? _ref1 : '',
          objects: []
        };
        return _this.forms[form].push(newFieldset);
      };
    })(this);
    this.createForm = (function(_this) {
      return function(formName, formArray) {
        var fieldset, formObject, _i, _len, _results;
        _this.addForm(formName);
        _results = [];
        for (_i = 0, _len = formArray.length; _i < _len; _i++) {
          fieldset = formArray[_i];
          if (fieldset.name === 'default') {
            _results.push((function() {
              var _j, _len1, _ref, _results1;
              _ref = fieldset.objects;
              _results1 = [];
              for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                formObject = _ref[_j];
                _results1.push(this.addFormObject(formName, null, formObject));
              }
              return _results1;
            }).call(_this));
          } else {
            _this.addFieldsetToForm(fieldset, formName);
            _results.push((function() {
              var _j, _len1, _ref, _results1;
              _ref = fieldset.objects;
              _results1 = [];
              for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                formObject = _ref[_j];
                _results1.push(this.addFormObject(formName, fieldset.name, formObject));
              }
              return _results1;
            }).call(_this));
          }
        }
        return _results;
      };
    })(this);
    this.addForm('default');
    this.$get = [
      '$injector', (function(_this) {
        return function($injector) {
          var component, name, _ref;
          _this.setupProviders($injector);
          _ref = _this.components;
          for (name in _ref) {
            component = _ref[name];
            _this.loadTemplate(component);
          }
          return {
            config: _this.config,
            components: _this.components,
            groups: _this.groups,
            forms: _this.forms,
            broadcastChannel: _this.broadcastChannel,
            registerComponent: _this.registerComponent,
            createForm: _this.createForm,
            addForm: _this.addForm,
            addFieldsetToForm: _this.addFieldsetToForm,
            addFormObject: _this.addFormObject,
            insertFormObject: _this.insertFormObject,
            removeFormObject: _this.removeFormObject,
            updateFormObjectIndex: _this.updateFormObjectIndex,
            moveFieldsetUp: _this.moveFieldsetUp,
            moveFieldsetDown: _this.moveFieldsetDown,
            removeFieldset: _this.removeFieldset
          };
        };
      })(this)
    ];
  });

}).call(this);
