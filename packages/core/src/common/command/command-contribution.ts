import { Contribution, IContributionProvider, InjectableService, createContribution } from "../framework";
import { Command, CommandHandler } from "./command-service";
import { CommandRegistry } from "./command-registry";

/**
 * The command contribution should be implemented to register custom commands and handler.
 */
export interface ICommandContribution {
  /**
   * Register commands and handlers.
   */
  registerCommands: (commands: CommandRegistry) => void;
}
export const [ICommandContribution, ICommandContributionProvider] = createContribution("CommandContribution");
export interface ICommandContributionProvider extends IContributionProvider<ICommandContribution> { }

export const [ICommand, ICommandProvider] = createContribution("Command");
export interface ICommand extends Command, CommandHandler { }
export interface ICommandProvider extends IContributionProvider<ICommand> { }

/**
 * 一个自定义的Command命令必须继承自AbstractCommand，以便能够加入到命令系统中。
 */
@Contribution(ICommand)
export abstract class AbstractCommand extends InjectableService implements ICommand {
  static Id: string;
  static Category?: string;
  static Label: string;

  public readonly id: string;
  public readonly category: string | undefined;
  public readonly originalCategory: string | undefined;
  public readonly label: string;
  public readonly originalLabel: string;

  constructor() {
    super();

    const staticProps = this.constructor as typeof AbstractCommand;

    this.id = staticProps.Id;
    this.category = staticProps.Category;
    this.originalCategory = staticProps.Category;
    this.label = staticProps.Label;
    this.originalLabel = staticProps.Label;
  }

  /**
   * Execute this handler.
   *
   * Don't call it directly.
   */
  abstract execute(...args: any[]): void;

  /**
   * Test whether this handler is enabled (active).
   */
  isEnabled?(...args: any[]): boolean;
  /**
   * Test whether menu items for this handler should be visible.
   */
  isVisible?(...args: any[]): boolean;
  /**
   * Test whether menu items for this handler should be toggled.
   */
  isToggled?(...args: any[]): boolean;
}
