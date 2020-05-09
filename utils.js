import rxjs from 'https://dev.jspm.io/rxjs@6';
import operators from 'https://dev.jspm.io/rxjs@6/operators';

const { fromEvent } = rxjs;
const { startWith, map, tap, switchMap, shareReplay, take } = operators;

const list = (length, fn) => Array.from({ length }, (_, i) => fn(i));

const capNumber = (min, max, number) => Math.max(min, Math.min(max, number));

const getInputNumberStream = element => fromEvent(element, 'input').pipe(
    map(({ target }) => target.value),
    startWith(element.value),
    map(val => Number(val)),
);

const getButtonClickStream = element => fromEvent(element, 'click').pipe(
    tap(event => event.preventDefault() && event.stopPropagation()),
);

const selectButtonFromKeyEventStream = (element, stream) => getButtonClickStream(element).pipe(
    switchMap(_ => stream.pipe(take(1))),
    map(({ key }) => key),
    tap(key => element.textContent = key),
    startWith(element.textContent),
    shareReplay(1),
);

const renderAsText = (observable, element) => observable.subscribe(value => element.textContent = String(value));

export {
    list,
    capNumber,
    getInputNumberStream,
    getButtonClickStream,
    selectButtonFromKeyEventStream,
    renderAsText
}