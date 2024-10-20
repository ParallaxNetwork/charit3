"use client";

import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { LuImagePlus } from "react-icons/lu";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import NavBack from "../nav-back";

const categoryTopics = [
  "Property & Hunger",
  "Education & Youth Development",
  "Health & Wellness",
  "Environment Conservation",
  "Animal Welfare",
  "Human Rights & Social Justice",
  "Disaster & Emergency Relief",
  "NGO Support",
];

const MAX_SUPPORTING_IMAGE = 6;

const formSchema = z.object({
  thumbnailImage:
    typeof window === "undefined"
      ? z.any()
      : z
          .instanceof(FileList)
          .refine((file) => file?.length == 1, "Thumnail image is required."),
  issueName: z.string(),
  categoryTopic: z.enum(
    [
      categoryTopics[0],
      categoryTopics[1],
      categoryTopics[2],
      categoryTopics[3],
      categoryTopics[4],
      categoryTopics[5],
      categoryTopics[6],
      categoryTopics[7],
    ],
    {
      required_error: "You need to select a category topic.",
    }
  ),
  description: z.string(),
  supportingImage:
    typeof window === "undefined"
      ? z.any()
      : z
          .array(z.instanceof(File))
          .refine(
            (files) => files?.length <= MAX_SUPPORTING_IMAGE,
            "Supporting image should not exceed " +
              MAX_SUPPORTING_IMAGE +
              " files."
          ),
  // typeof window === "undefined" ? z.any() : z.array(z.instanceof(FileList)),
});

const CreateIssueFormContent = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      thumbnailImage: undefined,
      issueName: "",
      categoryTopic: "",
      description: "",
      supportingImage: undefined,
    },
  });

  const thumbnailImageRef = form.register("thumbnailImage");
  const supportingImageRef = form.register("supportingImage");

  const { toast } = useToast();

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);

    try {
      toast({
        title: "Success",
        description: "Issue created successfully",
      });
      router.push("/home");
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to create issue",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container">
      <NavBack title="Create Issue" />
      <div className="px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
            <FormField
              control={form.control}
              name="thumbnailImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-dark text-sm">
                    Thumbnail Image (ratio 3:4)
                    <div className="mt-2 flex items-center justify-center bg-shade-white border-dashed border border-dark-grey rounded-lg px-6 py-6">
                      {field.value?.length ? (
                        <img
                          src={URL.createObjectURL(field.value[0])}
                          alt="thumbnail"
                          className="w-1/2 h-1/2 object-cover object-center rounded-lg"
                        />
                      ) : (
                        <>
                          <LuImagePlus className="text-dark-grey text-xl" />
                          <p className="text-dark-grey font-medium pl-2.5">
                            Upload cover image
                          </p>
                        </>
                      )}
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      {...thumbnailImageRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issueName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-dark text-sm">
                    Issue Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Input issue name"
                      className=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryTopic"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select Category Topic</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {categoryTopics.map((topic, i) => (
                        <FormItem
                          key={i}
                          className="flex items-center space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={topic} className="hidden" />
                          </FormControl>
                          <FormLabel className="w-full">
                            <div
                              className={cn(
                                "rounded-lg px-3 py-3.5 text-dark font-medium bg-shade-white text-center",
                                {
                                  "border border-blue bg-blue/10 text-blue":
                                    field.value === topic,
                                }
                              )}
                            >
                              {topic}
                            </div>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-dark text-sm">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Input Description"
                      className=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supportingImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-dark text-sm">
                    Supporting Image
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {field.value?.length ? (
                        Array.from(field.value).map(
                          (file: unknown, i: number) => (
                            <img
                              key={i}
                              src={URL.createObjectURL(file as File)}
                              alt="thumbnail"
                              className="w-[124px] h-[124px] object-cover object-center rounded-lg bg-shade-white"
                            />
                          )
                        )
                      ) : (
                        <>
                          <div className="w-[124px] h-[124px] object-cover object-center rounded-lg bg-shade-white"></div>
                          <div className="w-[124px] h-[124px] object-cover object-center rounded-lg bg-shade-white"></div>
                        </>
                      )}
                      {field.value?.length !== MAX_SUPPORTING_IMAGE && (
                        <div className="w-[124px] h-[124px] rounded-lg border-dashed border-dark-grey bg-shade-white text-center gap-2 flex flex-col items-center justify-center">
                          <LuImagePlus className="text-dark-grey text-xl" />
                          <p className="text-dark-grey font-medium pl-2.5">
                            Add image
                          </p>
                        </div>
                      )}
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      {...supportingImageRef}
                      onChange={(e) => {
                        // TODO: issue onchange not firinging when selecting same files

                        // if e.target.files length is 0, it means user has removed all files
                        // so we need to set the value to undefined
                        if (!e.target.files?.length) {
                          field.onChange(undefined);
                          return;
                        }

                        // max selected files length is MAX_SUPPORTING_IMAGE
                        if (e.target.files?.length > MAX_SUPPORTING_IMAGE) {
                          return;
                        }

                        // if user has added 6 files, what ever user select next, we need to save it
                        if (field.value?.length === MAX_SUPPORTING_IMAGE) {
                          field.onChange(Array.from(e.target.files));
                          return;
                        }

                        // if user has added files, we need to set the value to the files
                        if (field.value?.length) {
                          const fileList = e.target.files as FileList;

                          //   slice the files to the remaining files that can be added
                          const remainingFiles = Array.from(fileList).slice(
                            0,
                            MAX_SUPPORTING_IMAGE - field.value.length
                          );

                          // if user has already added files, we need to append the new files to the existing files
                          field.onChange([...field.value, ...remainingFiles]);
                          return;
                        }

                        field.onChange(Array.from(e.target.files));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full rounded-full">
              Submit
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

const CreateIssueForm = () => {
  return (
    <Suspense>
      <CreateIssueFormContent />
    </Suspense>
  );
};

export default CreateIssueForm;
