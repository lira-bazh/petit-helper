"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/app/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import { InputGroupAddon } from "@/app/components/ui/input-group";
import { toast } from "@/app/components/ui/toast";
import type { Locale } from "@/paraglide/runtime";
import * as m from "@/paraglide/messages.js";

type FlowerOption = { id: string; name: string; image: string };

export default function FlowerCrossSuggestion({
  locale,
  resultId,
  resultName,
  resultImage,
  speciesName,
  flowers,
}: {
  locale: Locale;
  resultId: string;
  resultName: string;
  resultImage: string;
  speciesName: string;
  flowers: FlowerOption[];
}) {
  const id = useId();
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "unavailable">("idle");

  async function sendSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || status === "sent") return;

    const formData = new FormData(event.currentTarget);
    const parentIds = [formData.get("parent1"), formData.get("parent2")];
    if (parentIds.some((id) => !flowers.some((flower) => flower.id === id))) {
      setStatus("error");
      return;
    }
    submitting.current = true;
    setStatus("sending");
    try {
      const response = await fetch("/api/flower-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId, parentIds, comment: formData.get("comment") ?? "" }),
      });
      const data: unknown = await response.json();
      if (response.status === 503) {
        setStatus("unavailable");
      } else if (response.ok && typeof data === "object" && data !== null && "ok" in data && data.ok === true) {
        setStatus("sent");
        setOpen(false);
        toast.add({ title: m.flowers_suggestion_sent({}, { locale }), type: "success" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open, eventDetails) => {
      if (submitting.current) {
        eventDetails.cancel();
        return;
      }
      if (open) setStatus("idle");
      setOpen(open);
    }}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus aria-hidden="true" />
        {m.flowers_suggest({}, { locale })}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 pr-8 leading-snug">
            <Image
              src={resultImage || "/images/flowers/unknown.png"}
              alt={`${resultName} (${speciesName})`}
              width={48}
              height={48}
              sizes="48px"
              className="size-12 shrink-0 object-contain"
            />
            <span>{m.flowers_suggestion_title({}, { locale })}</span>
          </DialogTitle>
          <DialogDescription>
            {m.flowers_suggestion_description({ result: resultName, species: speciesName }, { locale })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={sendSuggestion} className="grid gap-4" aria-busy={status === "sending"}>
          {[1, 2].map((parent) => (
            <div key={parent} className="grid gap-2">
              <label htmlFor={`${id}-parent-${parent}`} className="font-medium">
                {m.flowers_suggestion_parent({ number: parent }, { locale })}
              </label>
              <Combobox<FlowerOption>
                items={flowers}
                name={`parent${parent}`}
                required
                disabled={status === "sending" || status === "sent"}
                itemToStringLabel={(flower) => flower.name}
                itemToStringValue={(flower) => flower.id}
              >
                <ComboboxInput
                  id={`${id}-parent-${parent}`}
                  placeholder={m.flowers_suggestion_choose({}, { locale })}
                  className="h-10 w-full"
                >
                  <ComboboxValue>
                    {(flower: FlowerOption | null) => flower && (
                      <InputGroupAddon align="inline-start">
                        <Image
                          src={flower.image || "/images/flowers/unknown.png"}
                          alt=""
                          width={32}
                          height={32}
                          sizes="32px"
                          className="size-8 shrink-0 object-contain"
                        />
                      </InputGroupAddon>
                    )}
                  </ComboboxValue>
                </ComboboxInput>
                <ComboboxContent>
                  <ComboboxEmpty>{m.flowers_suggestion_no_results({}, { locale })}</ComboboxEmpty>
                  <ComboboxList>
                    {(flower: FlowerOption) => (
                      <ComboboxItem key={flower.id} value={flower}>
                        <Image
                          src={flower.image || "/images/flowers/unknown.png"}
                          alt=""
                          width={32}
                          height={32}
                          sizes="32px"
                          className="size-8 shrink-0 object-contain"
                        />
                        <span className="min-w-0 break-words">{flower.name}</span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          ))}
          <div className="grid gap-2">
            <label htmlFor={`${id}-comment`} className="font-medium">
              {m.flowers_suggestion_comment({}, { locale })}
            </label>
            <Textarea
              id={`${id}-comment`}
              name="comment"
              rows={3}
              maxLength={2000}
              disabled={status === "sending" || status === "sent"}
              placeholder={m.flowers_suggestion_comment_placeholder({}, { locale })}
            />
          </div>
          {(status === "error" || status === "unavailable") && (
            <p role="alert" className="text-sm text-destructive">
              {status === "unavailable"
                ? m.flowers_suggestion_unavailable({}, { locale })
                : m.flowers_suggestion_error({}, { locale })}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={status === "sending"} />}>
              {m.dialog_close({}, { locale })}
            </DialogClose>
            <Button type="submit" disabled={status === "sending" || status === "sent"}>
              {status === "sending"
                ? m.flowers_suggestion_sending({}, { locale })
                : m.flowers_suggestion_send({}, { locale })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
