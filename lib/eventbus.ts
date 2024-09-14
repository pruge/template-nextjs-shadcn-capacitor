/* eslint-disable @typescript-eslint/no-explicit-any */
import Event from 'eventbus-pubsub'

let $eventBus: CustomEvent

type handler = (data: any) => void
interface CustomEvent extends Event {
  on: (eventName: string, listener: handler) => void
  off: (eventName: string, listener: string | handler) => void
  trigger: (eventName: string, data: any) => void
  emit: (eventName: string, data: any) => void
}

if (process.env.NODE_ENV === 'production') {
  $eventBus = new Event()
} else {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  if (!global.$eventBus) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    global.$eventBus = new Event()
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  $eventBus = global.$eventBus
}

$eventBus.emit = $eventBus.trigger

export default $eventBus as CustomEvent
