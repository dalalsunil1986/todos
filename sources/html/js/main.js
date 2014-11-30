(function(window, console) {
    "use strict"

    var doc = window.document,
        JSON = window.JSON,
        todoListEl;

    var BindEvent = (function() {
        return doc.addEventListener ?
            function(element, type, listener) {
                element.addEventListener(type, listener);
            } :
            function (element, type, listener) {
                element.attachEvent('on' + type, listener);
            };
    })();

    var network = (function() {
        function request(method, url, text, cont) {
            var http = new XMLHttpRequest();

            http.onreadystatechange = function() {
                if (http.readyState === 4) {
                    if (http.status === 200) {
                        cont(false, http.responseText ? 
                                JSON.parse(http.responseText) : null);
                    } else {
                        console.error('Cannot make a request [' + method +
                                '] for [' + url + ']');
                        cont(true);
                    }
                }
            };

            http.open(method, 'todo' + url, true);
            http.send(text);
        }

        return {
            SetCompleted: function(id, cont) {
                request('PUT', '/' + id, null, cont);
            },
            GetList: function(cont) {
                request('GET', '/all', null, cont);
            },
            Delete: function(id, cont) {
                request('DELETE', '/' + id, null, cont);
            },
            Add: function(text, cont) {
                request('POST', '/new', text, cont);
            }
        };
    })();

    var todo = (function() {
        var completedCnt = 0,
            inProgressCnt = 0;

        function UpdateStatus() {
            doc.getElementById('completed-cnt').innerHTML = completedCnt;
            doc.getElementById('in-progress-cnt').innerHTML = inProgressCnt;
        }

        function AddTodo(todo) {
            var li = doc.createElement('li');

            //TODO: Use templates
            li.innerHTML = ['<li id="todo-' + todo.id + '" class="todo-item ' +
                                   (todo.isCompleted ? 'completed' : '' )+ '">',
                            '  <span class="icon-status">&#10004;</span>',
                               todo.text,
                            '  <span class="icon-delete">&#10006;</span>',
                            '</li>'].join('');
            todoListEl.appendChild(li);
            todo.isCompleted ? ++completedCnt : ++inProgressCnt;
            UpdateStatus();
        }

        function MakeList() {
            network.GetList(function(error, list) {
                var i, cnt;

                if (!error) {
                    if (list) {
                        for (i = 0, cnt = list.length; i < cnt; ++i) {
                            AddTodo(list[i]);
                        }
                    }
                } else {
                    alert('Cannot get list from server');
                }
            });
        }

        function NewTodoEvent(event) {
            var text;

            if (13 === event.keyCode) { //Enter key
                text = this.value;
                this.value = '';
                network.Add(text, function(error, todo) {
                    if (!error) {
                        AddTodo(todo);
                    } else {
                        alert('Cannot add new TODO');
                    }
                });
            }
        }

        function CompleteTodoEvent(event) {
            var li;

            if (0 > event.target.className.indexOf('icon-status')) {
                return;
            }

            li = event.target.parentNode;

            if (0 < li.className.indexOf('completed')) {
                return;
            }

            network.SetCompleted(li.id.substr(5), function(error) {
                if (!error) {
                    li.className += ' completed';
                    li = null;
                    ++completedCnt;
                    --inProgressCnt;
                    UpdateStatus();
                } else {
                    alert('Error updating TODO');
                }
            });
        }

        function DeleteTodoEvent(event) {
            var li;

            if (0 > event.target.className.indexOf('icon-delete')) {
                return;
            }

            li = event.target.parentNode;

            network.Delete(li.id.substr(5), function(error) {
                if (!error) {
                    if (0 < li.className.indexOf('completed')) {
                        --completedCnt;
                    } else {
                        --inProgressCnt;
                    }

                    li.parentNode.removeChild(li);
                    li = null;
                    UpdateStatus();
                } else {
                    alert('Error deleting TODO');
                }
            });
        }

        return {
            Init: function() {
                todoListEl = doc.getElementsByClassName('todo-list')[0];

                BindEvent(doc.getElementById('new-todo'),
                    'keypress', NewTodoEvent);
                BindEvent(todoListEl, 'click', CompleteTodoEvent);
                BindEvent(todoListEl, 'click', DeleteTodoEvent);

                MakeList();
            }
        };
    })();

    BindEvent(window, 'load', todo.Init);
})(window, console);
