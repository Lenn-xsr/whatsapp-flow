import Message, { MessageType } from '../../domain/message';

/** What an external listener can subscribe to. */
export interface MessageIdentifier {
  type: MessageType;
  /** Business phone number that received the message. */
  number: string;
  /** Text, button text or selected option id of the message. */
  content: string;
}

export interface MessageListenerPort {
  /**
   * Offers a message to the external listeners subscribed to it.
   * @returns true when a listener took the message, false when nobody is
   * subscribed or the listener did not acknowledge it in time
   */
  deliver(identifier: MessageIdentifier, message: Message): Promise<boolean>;
}
