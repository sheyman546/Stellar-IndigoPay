import { fireEvent, render, screen } from "@testing-library/react";
import InstallPrompt from "../InstallPrompt";

describe("InstallPrompt", () => {
  it("shows the install prompt after beforeinstallprompt", () => {
    render(<InstallPrompt />);

    const event = new Event("beforeinstallprompt");
    window.dispatchEvent(event);

    expect(screen.getByText(/Add IndigoPay to your home screen/i)).toBeInTheDocument();
  });

  it("calls the deferred prompt when the install button is pressed", () => {
    const prompt = jest.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt") as Event & { preventDefault: () => void; prompt: () => Promise<void> };
    event.preventDefault = jest.fn();
    event.prompt = prompt;

    render(<InstallPrompt />);
    window.dispatchEvent(event);

    fireEvent.click(screen.getByRole("button", { name: /install/i }));

    expect(prompt).toHaveBeenCalled();
  });

  it("dismisses the prompt when the dismiss button is pressed", () => {
    render(<InstallPrompt />);

    window.dispatchEvent(new Event("beforeinstallprompt"));
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(screen.queryByText(/Add IndigoPay to your home screen/i)).not.toBeInTheDocument();
  });
});
